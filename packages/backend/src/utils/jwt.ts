/**
 * JWT Token Utilities
 * Handles JWT token generation and verification
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate a JWT token for a user
 * @param payload - Token payload containing userId and email
 * @returns Signed JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(
    payload, 
    config.jwt.secret, 
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}
