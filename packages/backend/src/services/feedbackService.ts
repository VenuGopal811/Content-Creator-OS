/**
 * Feedback Service
 * Handles database operations for Feedback entities
 */

import { Pool } from 'pg';
import {
  Feedback,
  CreateFeedbackInput,
  UpdateFeedbackInput,
} from '../models/Feedback';

export class FeedbackService {
  constructor(private pool: Pool) {}

  /**
   * Create a new feedback entry
   * @param input - Feedback creation data
   * @returns Promise resolving to the created feedback
   */
  async createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
    const result = await this.pool.query<any>(
      `INSERT INTO feedback (content_id, user_id, type, data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content_id, user_id, type, data, created_at`,
      [input.contentId, input.userId, input.type, JSON.stringify(input.data)]
    );

    return this.mapRowToFeedback(result.rows[0]);
  }

  /**
   * Find a feedback entry by ID
   * @param id - Feedback ID
   * @returns Promise resolving to the feedback or null if not found
   */
  async findById(id: string): Promise<Feedback | null> {
    const result = await this.pool.query<any>(
      `SELECT id, content_id, user_id, type, data, created_at
       FROM feedback
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFeedback(result.rows[0]);
  }

  /**
   * Find all feedback for a content piece
   * @param contentId - Content ID
   * @param type - Optional filter by feedback type
   * @returns Promise resolving to an array of feedback
   */
  async findByContentId(
    contentId: string,
    type?: string
  ): Promise<Feedback[]> {
    const query = type
      ? `SELECT id, content_id, user_id, type, data, created_at
         FROM feedback
         WHERE content_id = $1 AND type = $2
         ORDER BY created_at DESC`
      : `SELECT id, content_id, user_id, type, data, created_at
         FROM feedback
         WHERE content_id = $1
         ORDER BY created_at DESC`;

    const params = type ? [contentId, type] : [contentId];
    const result = await this.pool.query<any>(query, params);

    return result.rows.map((row) => this.mapRowToFeedback(row));
  }

  /**
   * Find all feedback by a user
   * @param userId - User ID
   * @param type - Optional filter by feedback type
   * @returns Promise resolving to an array of feedback
   */
  async findByUserId(userId: string, type?: string): Promise<Feedback[]> {
    const query = type
      ? `SELECT id, content_id, user_id, type, data, created_at
         FROM feedback
         WHERE user_id = $1 AND type = $2
         ORDER BY created_at DESC`
      : `SELECT id, content_id, user_id, type, data, created_at
         FROM feedback
         WHERE user_id = $1
         ORDER BY created_at DESC`;

    const params = type ? [userId, type] : [userId];
    const result = await this.pool.query<any>(query, params);

    return result.rows.map((row) => this.mapRowToFeedback(row));
  }

  /**
   * Update a feedback entry
   * @param id - Feedback ID
   * @param input - Feedback update data
   * @returns Promise resolving to the updated feedback or null if not found
   */
  async updateFeedback(
    id: string,
    input: UpdateFeedbackInput
  ): Promise<Feedback | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(input.type);
    }

    if (input.data !== undefined) {
      updates.push(`data = $${paramCount++}`);
      values.push(JSON.stringify(input.data));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.pool.query<any>(
      `UPDATE feedback
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, content_id, user_id, type, data, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFeedback(result.rows[0]);
  }

  /**
   * Delete a feedback entry
   * @param id - Feedback ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteFeedback(id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM feedback WHERE id = $1`, [
      id,
    ]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Map database row to Feedback object
   * @param row - Database row
   * @returns Feedback object
   */
  private mapRowToFeedback(row: any): Feedback {
    return {
      id: row.id,
      contentId: row.content_id,
      userId: row.user_id,
      type: row.type,
      data: row.data,
      createdAt: row.created_at,
    };
  }
}
