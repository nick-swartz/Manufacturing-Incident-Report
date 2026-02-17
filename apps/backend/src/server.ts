import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import incidentRoutes from './routes/incidents';
import analyticsRoutes, { startScheduler, stopScheduler } from './routes/analytics';
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'manufacturing-incident-system'
  });
});

// API routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/analytics', analyticsRoutes);

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
