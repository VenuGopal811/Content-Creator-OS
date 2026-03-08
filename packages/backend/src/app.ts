import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/auth';
import { createProjectRouter } from './routes/projects';
import { pool } from './db/pool';
import { createContentRouter } from './routes/content';
import { createAiRouter } from './routes/ai';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'ContentOS API v1.0' });
});

// Auth routes
app.use('/api/auth', createAuthRouter(pool));

// Project routes
app.use('/api/projects', createProjectRouter(pool));

// Content routes
app.use('/api/content', createContentRouter(pool));

// AI routes
app.use('/api/ai', createAiRouter(pool));

// Error handling
app.use(errorHandler);

export default app;
