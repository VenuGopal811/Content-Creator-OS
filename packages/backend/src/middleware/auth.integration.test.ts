/**
 * JWT Authentication Middleware Integration Tests
 * Tests the middleware working with actual Express routes
 * Validates: Requirements 1.5
 */

import request from 'supertest';
import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from './auth';
import { generateToken } from '../utils/jwt';

describe('JWT Middleware Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a test Express app with protected routes
    app = express();
    app.use(express.json());

    // Public route (no auth required)
    app.get('/api/public', (_req: Request, res: Response) => {
      res.json({ message: 'Public endpoint' });
    });

    // Protected route (auth required)
    app.get('/api/protected', authMiddleware, (req: AuthRequest, res: Response) => {
      res.json({
        message: 'Protected endpoint',
        userId: req.userId,
        user: req.user,
      });
    });

    // Protected POST route
    app.post('/api/protected/data', authMiddleware, (req: AuthRequest, res: Response) => {
      res.json({
        message: 'Data created',
        userId: req.userId,
        data: req.body,
      });
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without token', async () => {
      const response = await request(app)
        .get('/api/public')
        .expect(200);

      expect(response.body.message).toBe('Public endpoint');
    });
  });

  describe('Protected Routes', () => {
    it('should allow access with valid JWT token', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = generateToken({ userId, email });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Protected endpoint');
      expect(response.body.userId).toBe(userId);
      expect(response.body.user).toEqual({ id: userId, email });
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
      expect(response.body.error.message).toContain('Authentication required');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toContain('session has expired');
    });

    it('should work with POST requests', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = generateToken({ userId, email });

      const testData = { name: 'Test Item', value: 42 };

      const response = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .send(testData)
        .expect(200);

      expect(response.body.message).toBe('Data created');
      expect(response.body.userId).toBe(userId);
      expect(response.body.data).toEqual(testData);
    });

    it('should attach correct user context for different users', async () => {
      const users = [
        { userId: 'user-1', email: 'user1@example.com' },
        { userId: 'user-2', email: 'user2@example.com' },
        { userId: 'user-3', email: 'user3@example.com' },
      ];

      for (const user of users) {
        const token = generateToken(user);

        const response = await request(app)
          .get('/api/protected')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.userId).toBe(user.userId);
        expect(response.body.user.id).toBe(user.userId);
        expect(response.body.user.email).toBe(user.email);
      }
    });
  });

  describe('Token Expiration in Real Requests', () => {
    it('should reject requests with expired tokens', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      
      // Create a token that's already expired
      const jwt = require('jsonwebtoken');
      const config = require('../config').config;
      const expiredToken = jwt.sign(
        { userId, email },
        config.jwt.secret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toContain('session has expired');
    });
  });

  describe('Multiple Protected Routes', () => {
    it('should protect multiple routes with the same middleware', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = generateToken({ userId, email });

      // Test GET route
      const getResponse = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getResponse.body.userId).toBe(userId);

      // Test POST route with same token
      const postResponse = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .send({ test: 'data' })
        .expect(200);

      expect(postResponse.body.userId).toBe(userId);
    });

    it('should deny access to all protected routes without token', async () => {
      // Try GET route
      await request(app)
        .get('/api/protected')
        .expect(401);

      // Try POST route
      await request(app)
        .post('/api/protected/data')
        .send({ test: 'data' })
        .expect(401);
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for missing token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(typeof response.body.error.timestamp).toBe('string');
    });

    it('should return consistent error format for invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });
  });
});
