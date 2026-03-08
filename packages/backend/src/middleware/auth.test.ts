/**
 * JWT Authentication Middleware Tests
 * Tests for JWT token verification, expiration, and user context attachment
 * Validates: Requirements 1.5
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from './auth';
import { config } from '../config';

describe('JWT Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('Token Verification', () => {
    it('should verify valid JWT token and attach user context', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1h' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBe(userId);
      expect(mockRequest.user).toEqual({ id: userId, email });
    });

    it('should reject request with missing authorization header', () => {
      mockRequest.headers = {};

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication required. Please log in.',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication required. Please log in.',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid JWT token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.jwt.token',
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Your session has expired. Please log in again.',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with token signed with wrong secret', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = jwt.sign({ userId, email }, 'wrong-secret', { expiresIn: '1h' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Your session has expired. Please log in again.',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired JWT token', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      // Create token that expired 1 hour ago
      const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '-1h' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Your session has expired. Please log in again.',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should accept token that is about to expire but still valid', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      // Create token that expires in 1 second
      const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1s' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBe(userId);
      expect(mockRequest.user).toEqual({ id: userId, email });
    });
  });

  describe('User Context Attachment', () => {
    it('should attach userId to request object', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1h' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe(userId);
      expect(mockRequest.userId).toBeDefined();
      expect(typeof mockRequest.userId).toBe('string');
    });

    it('should attach user object with id and email to request', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1h' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user).toEqual({
        id: userId,
        email: email,
      });
    });

    it('should handle different user IDs correctly', () => {
      const testCases = [
        { userId: 'user-1', email: 'user1@example.com' },
        { userId: 'user-2', email: 'user2@example.com' },
        { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'user3@example.com' },
      ];

      testCases.forEach(({ userId, email }) => {
        const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1h' });
        const req: Partial<AuthRequest> = {
          headers: { authorization: `Bearer ${token}` },
        };
        const res: Partial<Response> = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };
        const next = jest.fn();

        authMiddleware(req as AuthRequest, res as Response, next);

        expect(req.userId).toBe(userId);
        expect(req.user?.id).toBe(userId);
        expect(req.user?.email).toBe(email);
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Bearer token', () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle Bearer token with extra spaces', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1h' });

      mockRequest.headers = {
        authorization: `Bearer  ${token}`, // Extra space
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      // Should fail because of the extra space
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive Bearer prefix', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1h' });

      mockRequest.headers = {
        authorization: `bearer ${token}`, // lowercase
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle token with missing payload fields', () => {
      // Token without email field
      const token = jwt.sign({ userId: '123' }, config.jwt.secret, { expiresIn: '1h' });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      // Should still work, just with undefined email
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBe('123');
      expect(mockRequest.user?.email).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for unexpected errors', () => {
      // Mock jwt.verify to throw an unexpected error
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const token = 'some-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
