import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { authenticateJWT } from '../middleware/auth.middleware';
import { LoginRequest } from '@incident-system/shared';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const authService = new AuthService();
const storageService = new StorageService();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, jiraApiToken } = req.body as LoginRequest;

    if (!email || !jiraApiToken) {
      res.status(400).json({ error: 'Email and API token are required' });
      return;
    }

    // Verify Jira credentials
    const verification = await authService.verifyJiraCredentials(email, jiraApiToken);

    if (!verification.isValid) {
      res.status(401).json({ error: 'Invalid Jira credentials' });
      return;
    }

    // Check if user exists
    let user = storageService.getUserByEmail(email);

    if (!user) {
      // Create new user
      const userId = uuidv4();
      const role = authService.determineUserRole(email);

      user = storageService.createUser(
        userId,
        email,
        verification.userName || email,
        role,
        email
      );

      logger.info(`New user created: ${email} with role ${role}`);
    } else {
      // Update last login
      storageService.updateLastLogin(user.id);
      logger.info(`User logged in: ${email}`);
    }

    // Generate JWT
    const token = authService.generateJWT(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        jiraEmail: user.jiraEmail,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error: any) {
    logger.error('Login error', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/verify', authenticateJWT, (req: Request, res: Response): void => {
  res.json({
    valid: true,
    user: req.user
  });
});

router.get('/me', authenticateJWT, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = storageService.getUserById(req.user.userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

// OAuth 2.0 routes
router.get('/oauth/url', (req: Request, res: Response): void => {
  try {
    const { url, state, codeVerifier } = authService.getAuthorizationUrl();

    // Store state and codeVerifier in session or return to client to store
    // For simplicity, we'll return them to the client to send back during callback
    res.json({
      url,
      state,
      codeVerifier
    });
  } catch (error: any) {
    logger.error('Failed to generate OAuth URL', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.post('/oauth/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, codeVerifier, expectedState } = req.body;

    if (!code || !codeVerifier) {
      res.status(400).json({ error: 'Missing authorization code or code verifier' });
      return;
    }

    // Verify state to prevent CSRF attacks
    if (state !== expectedState) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    // Exchange code for tokens
    const tokens = await authService.exchangeCodeForToken(code, codeVerifier);

    // Get user info from Atlassian
    const userInfo = await authService.getUserInfoFromOAuth(tokens.accessToken);

    // Check if user exists
    let user = storageService.getUserByEmail(userInfo.email);

    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    if (!user) {
      // Create new user
      const userId = uuidv4();
      const role = authService.determineUserRole(userInfo.email);

      user = storageService.createUserWithOAuth(
        userId,
        userInfo.email,
        userInfo.name,
        role,
        tokens.accessToken,
        tokens.refreshToken,
        expiresAt
      );

      logger.info(`New user created via OAuth: ${userInfo.email} with role ${role}`);
    } else {
      // Update existing user with OAuth tokens
      storageService.updateUserOAuthTokens(
        user.id,
        tokens.accessToken,
        tokens.refreshToken,
        expiresAt
      );

      logger.info(`User logged in via OAuth: ${userInfo.email}`);
    }

    // Generate JWT for our system
    const jwtToken = authService.generateJWT(user);

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        jiraEmail: user.jiraEmail,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error: any) {
    logger.error('OAuth callback error', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
