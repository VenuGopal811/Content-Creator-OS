/**
 * Authentication Routes
 * Handles user registration, login, and password reset
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService';
import { generateToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { AppError } from '../middleware/errorHandler';
import { Pool } from 'pg';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  name: z.string().min(1, 'Name is required'),
  preferences: z.object({
    defaultTone: z.string().optional(),
    defaultPersona: z.string().optional(),
    preferredFormats: z.array(z.string()).optional(),
  }).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(4, 'Password must be at least 4 characters'),
});

export function createAuthRouter(pool: Pool): Router {
  const router = Router();
  const userService = new UserService(pool);

  /**
   * POST /api/auth/register
   * Register a new user account
   */
  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          firstError.message,
          { field: firstError.path.join('.') }
        );
      }

      const { email, password, name, preferences } = validationResult.data;

      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        throw new AppError(
          409,
          'USER_EXISTS',
          'An account with this email already exists. Please log in instead.'
        );
      }

      // Create user (password hashing is handled in userService)
      const user = await userService.createUser({
        email,
        password,
        name,
        preferences,
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      // Return user and token
      res.status(201).json({
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user with email and password
   */
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          firstError.message,
          { field: firstError.path.join('.') }
        );
      }

      const { email, password } = validationResult.data;

      // Find user by email
      const user = await userService.findByEmail(email);
      if (!user) {
        throw new AppError(
          401,
          'INVALID_CREDENTIALS',
          'Invalid email or password'
        );
      }

      // Compare password with stored hash
      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError(
          401,
          'INVALID_CREDENTIALS',
          'Invalid email or password'
        );
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      // Return user (without password) and token
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(200).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/auth/reset-request
   * Request a password reset token
   */
  router.post('/reset-request', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = resetRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          firstError.message,
          { field: firstError.path.join('.') }
        );
      }

      const { email } = validationResult.data;

      // Create reset token (returns null if user not found)
      const token = await userService.createPasswordResetToken(email);

      // Always return success to prevent email enumeration
      // In production, this would send an email with the reset link
      res.status(200).json({
        message: 'If an account with that email exists, a password reset link has been sent.',
        // For MVP/testing purposes, include the token in response
        // In production, this would be sent via email only
        ...(token && { token }),
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/auth/reset-password
   * Reset password using a reset token
   */
  router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = resetPasswordSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          firstError.message,
          { field: firstError.path.join('.') }
        );
      }

      const { token, newPassword } = validationResult.data;

      // Reset password
      const success = await userService.resetPassword(token, newPassword);

      if (!success) {
        throw new AppError(
          400,
          'INVALID_TOKEN',
          'The password reset token is invalid or has expired. Please request a new one.'
        );
      }

      res.status(200).json({
        message: 'Your password has been successfully reset. You can now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
