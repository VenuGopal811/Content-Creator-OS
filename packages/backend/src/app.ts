import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/auth';
import { createProjectRouter } from './routes/projects';
import { pool } from './db/pool';

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

// Error handling
app.use(errorHandler);

export default app;
