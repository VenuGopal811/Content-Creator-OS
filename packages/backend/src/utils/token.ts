/**
 * Token Utilities
 * Handles generation of secure random tokens
 */

import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex-encoded token string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a password reset token with expiration
 * @param expirationHours - Hours until token expires (default: 1)
 * @returns Object with token and expiration date
 */
export function generateResetToken(expirationHours: number = 1): {
  token: string;
  expiresAt: Date;
} {
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);

  return { token, expiresAt };
}
