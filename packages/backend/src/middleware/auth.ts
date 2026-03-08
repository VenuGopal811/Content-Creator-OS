import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication required. Please log in.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
      };
      
      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
      
      next();
    } catch (err) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Your session has expired. Please log in again.',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication.',
        timestamp: new Date().toISOString(),
      },
    });
  }
};
