/**
 * User Service
 * Handles database operations for User entities
 */

import { Pool } from 'pg';
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserWithoutPassword,
} from '../models/user';
import { hashPassword } from '../utils/password';
import { generateResetToken } from '../utils/token';

export class UserService {
  constructor(private pool: Pool) {}

  /**
   * Create a new user
   * @param input - User creation data
   * @returns Promise resolving to the created user (without password hash)
   */
  async createUser(input: CreateUserInput): Promise<UserWithoutPassword> {
    const passwordHash = await hashPassword(input.password);
    const preferences = input.preferences || {};

    const result = await this.pool.query<User>(
      `INSERT INTO users (email, password_hash, name, preferences)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, password_hash, name, preferences, created_at`,
      [input.email, passwordHash, input.name, JSON.stringify(preferences)]
    );

    const user = this.mapRowToUser(result.rows[0]);
    return this.excludePassword(user);
  }

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns Promise resolving to the user or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      `SELECT id, email, password_hash, name, preferences, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Find a user by email
   * @param email - User email
   * @returns Promise resolving to the user or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      `SELECT id, email, password_hash, name, preferences, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Update a user
   * @param id - User ID
   * @param input - User update data
   * @returns Promise resolving to the updated user (without password hash)
   */
  async updateUser(
    id: string,
    input: UpdateUserInput
  ): Promise<UserWithoutPassword | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(input.name);
    }

    if (input.preferences !== undefined) {
      updates.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(input.preferences));
    }

    if (updates.length === 0) {
      const user = await this.findById(id);
      return user ? this.excludePassword(user) : null;
    }

    values.push(id);

    const result = await this.pool.query<User>(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, password_hash, name, preferences, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = this.mapRowToUser(result.rows[0]);
    return this.excludePassword(user);
  }

  /**
   * Delete a user
   * @param id - User ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM users WHERE id = $1`,
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Map database row to User object
   * @param row - Database row
   * @returns User object
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      preferences: typeof row.preferences === 'string' 
        ? JSON.parse(row.preferences) 
        : row.preferences,
      createdAt: row.created_at,
    };
  }

  /**
   * Remove password hash from user object
   * @param user - User object
   * @returns User object without password hash
   */
  private excludePassword(user: User): UserWithoutPassword {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create a password reset token for a user
   * @param email - User email
   * @returns Promise resolving to the reset token or null if user not found
   */
  async createPasswordResetToken(email: string): Promise<string | null> {
    // Find user by email
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    // Generate reset token with 1 hour expiration
    const { token, expiresAt } = generateResetToken(1);

    // Store token in database
    await this.pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    return token;
  }

  /**
   * Verify a password reset token
   * @param token - Reset token
   * @returns Promise resolving to user ID if valid, null otherwise
   */
  async verifyResetToken(token: string): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT user_id, expires_at, used
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { user_id, expires_at, used } = result.rows[0];

    // Check if token is already used
    if (used) {
      return null;
    }

    // Check if token is expired
    if (new Date() > new Date(expires_at)) {
      return null;
    }

    return user_id;
  }

  /**
   * Reset user password using a reset token
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Promise resolving to true if successful, false otherwise
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Verify token and get user ID
    const userId = await this.verifyResetToken(token);
    if (!userId) {
      return false;
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    const updateResult = await this.pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [passwordHash, userId]
    );

    if (updateResult.rowCount === 0) {
      return false;
    }

    // Mark token as used
    await this.pool.query(
      `UPDATE password_reset_tokens
       SET used = true
       WHERE token = $1`,
      [token]
    );

    return true;
  }
}
