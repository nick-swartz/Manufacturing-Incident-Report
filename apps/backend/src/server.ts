import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middleware/errorHandler';
import incidentRoutes from './routes/incidents';
import analyticsRoutes, { startScheduler, stopScheduler } from './routes/analytics';
import authRoutes from './routes/auth.routes';
import trackingRoutes from './routes/tracking';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Debug: Log if env vars are loaded
console.log('Environment check:', {
  hasJiraUrl: !!process.env.JIRA_URL,
  hasJiraEmail: !!process.env.JIRA_EMAIL,
  hasJiraToken: !!process.env.JIRA_API_TOKEN
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  exposedHeaders: ['Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with inline disposition for images
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads');

// Custom route for viewing images/files inline
app.get('/uploads/*', (req: Request, res: Response) => {
  const filePath = path.join(uploadDir, req.params[0]);

  // Security check - ensure path is within uploadDir
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDir);

  logger.info(`File request: ${req.params[0]}`);
  logger.info(`Resolved path: ${resolvedPath}`);

  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    logger.warn(`Access denied: ${resolvedPath} not in ${resolvedUploadDir}`);
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    logger.warn(`File not found: ${resolvedPath}`);
    return res.status(404).json({ error: 'File not found' });
  }

  const ext = path.extname(filePath).toLowerCase();

  // Map file extensions to proper MIME types
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };

  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  // Force inline display - don't trigger download
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  logger.info(`Serving file with Content-Type: ${mimeType}, Content-Disposition: inline`);

  // Send the file
  res.sendFile(resolvedPath);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'manufacturing-incident-system'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tracking', trackingRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Catch-all route for SPA (must be after API routes)
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized');

    // Start automatic Jira status sync
    startScheduler();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      if (process.env.NODE_ENV === 'production') {
        logger.info(`Frontend: http://localhost:${PORT}`);
      }
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      stopScheduler();
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      stopScheduler();
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

export default app;
