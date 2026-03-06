import axios from 'axios';
import jwt from 'jsonwebtoken';
import { User, AuthUser } from '@incident-system/shared';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const JIRA_URL = process.env.JIRA_URL;

// OAuth 2.0 configuration
const OAUTH_CLIENT_ID = process.env.JIRA_OAUTH_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.JIRA_OAUTH_CLIENT_SECRET;
const OAUTH_REDIRECT_URI = process.env.JIRA_OAUTH_REDIRECT_URI || 'http://localhost:5173/auth/callback';
const OAUTH_SCOPES = process.env.JIRA_OAUTH_SCOPES || 'read:jira-user read:jira-work write:jira-work offline_access';

// Atlassian OAuth endpoints
const OAUTH_AUTHORIZE_URL = 'https://auth.atlassian.com/authorize';
const OAUTH_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';
const OAUTH_USER_INFO_URL = 'https://api.atlassian.com/me';
const OAUTH_ACCESSIBLE_RESOURCES_URL = 'https://api.atlassian.com/oauth/token/accessible-resources';

export class AuthService {
  async verifyJiraCredentials(email: string, apiToken: string): Promise<{ isValid: boolean; userName?: string }> {
    if (!JIRA_URL) {
      throw new Error('JIRA_URL not configured');
    }

    try {
      const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

      const response = await axios.get(`${JIRA_URL}/rest/api/3/myself`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      const displayName = response.data.displayName || response.data.emailAddress || email;

      logger.info(`Jira credentials verified for ${email}`);

      return {
        isValid: true,
        userName: displayName
      };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn(`Invalid Jira credentials for ${email}`);
        return { isValid: false };
      }

      logger.error('Error verifying Jira credentials', error.response?.data || error.message);
      throw new Error('Failed to verify Jira credentials');
    }
  }

  generateJWT(user: User): string {
    const payload: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY as string
    } as jwt.SignOptions);
  }

  verifyJWT(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('JWT token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug('Invalid JWT token');
      }
      return null;
    }
  }

  determineUserRole(jiraEmail: string): 'admin' | 'analyst' | 'reporter' {
    // Default role assignment logic
    // Can be enhanced to check Jira groups or use a role mapping table

    // For now, use a simple email-based rule
    // In production, this should query Jira groups or use a configuration
    const email = jiraEmail.toLowerCase();

    if (email.includes('admin')) {
      return 'admin';
    }

    if (email.includes('analyst') || email.includes('supervisor') || email.includes('engineer')) {
      return 'analyst';
    }

    return 'reporter';
  }

  // ========== OAuth 2.0 Methods ==========

  /**
   * Generate OAuth 2.0 authorization URL with PKCE
   */
  getAuthorizationUrl(): { url: string; state: string; codeVerifier: string } {
    // Read at runtime to ensure .env is loaded
    const clientId = process.env.JIRA_OAUTH_CLIENT_ID;
    const redirectUri = process.env.JIRA_OAUTH_REDIRECT_URI || 'http://localhost:5173/auth/callback';
    const scopes = process.env.JIRA_OAUTH_SCOPES || 'read:jira-user read:jira-work write:jira-work offline_access';

    if (!clientId) {
      throw new Error('JIRA_OAUTH_CLIENT_ID not configured');
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
      response_type: 'code',
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;

    logger.info('Generated OAuth authorization URL');

    return {
      url: authUrl,
      state,
      codeVerifier
    };
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const clientId = process.env.JIRA_OAUTH_CLIENT_ID;
    const clientSecret = process.env.JIRA_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.JIRA_OAUTH_REDIRECT_URI || 'http://localhost:5173/auth/callback';

    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured');
    }

    try {
      const response = await axios.post(
        OAUTH_TOKEN_URL,
        {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Successfully exchanged authorization code for tokens');

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error: any) {
      logger.error('Failed to exchange authorization code', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user info from Atlassian using OAuth access token
   * Uses Jira API instead of /me endpoint to avoid needing read:me scope
   */
  async getUserInfoFromOAuth(accessToken: string): Promise<{
    accountId: string;
    email: string;
    name: string;
  }> {
    try {
      // First, get the accessible resources (cloud ID)
      const resourcesResponse = await axios.get(OAUTH_ACCESSIBLE_RESOURCES_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!resourcesResponse.data || resourcesResponse.data.length === 0) {
        throw new Error('No accessible Jira instances found');
      }

      const cloudId = resourcesResponse.data[0].id;
      const jiraUrl = resourcesResponse.data[0].url;

      // Get user info from Jira API (which we have access to with read:jira-user)
      const userResponse = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      logger.info(`Retrieved user info for ${userResponse.data.emailAddress}`);

      return {
        accountId: userResponse.data.accountId,
        email: userResponse.data.emailAddress,
        name: userResponse.data.displayName
      };
    } catch (error: any) {
      logger.error('Failed to get user info from OAuth', error.response?.data || error.message);
      throw new Error('Failed to retrieve user information');
    }
  }

  /**
   * Get accessible Jira resources (cloud IDs)
   */
  async getAccessibleResources(accessToken: string): Promise<string | null> {
    try {
      const response = await axios.get(OAUTH_ACCESSIBLE_RESOURCES_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.length > 0) {
        const cloudId = response.data[0].id;
        logger.info(`Retrieved cloud ID: ${cloudId}`);
        return cloudId;
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to get accessible resources', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Refresh expired access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const clientId = process.env.JIRA_OAUTH_CLIENT_ID;
    const clientSecret = process.env.JIRA_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured');
    }

    try {
      const response = await axios.post(
        OAUTH_TOKEN_URL,
        {
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Successfully refreshed access token');

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresIn: response.data.expires_in
      };
    } catch (error: any) {
      logger.error('Failed to refresh access token', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }
}
