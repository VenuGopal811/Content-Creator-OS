/**
 * PerformanceMetrics Service
 * Handles database operations for PerformanceMetrics entities
 */

import { Pool } from 'pg';
import {
  PerformanceMetrics,
  CreatePerformanceMetricsInput,
  UpdatePerformanceMetricsInput,
} from '../models/PerformanceMetrics';

export class PerformanceMetricsService {
  constructor(private pool: Pool) {}

  /**
   * Create a new performance metrics entry
   * @param input - Performance metrics creation data
   * @returns Promise resolving to the created performance metrics
   */
  async createPerformanceMetrics(
    input: CreatePerformanceMetricsInput
  ): Promise<PerformanceMetrics> {
    const views = input.views ?? 0;
    const engagement = input.engagement ?? 0;
    const conversions = input.conversions ?? 0;

    // Calculate engagement rate: (engagement / views) * 100
    const engagementRate =
      input.engagementRate ??
      (views > 0 ? parseFloat(((engagement / views) * 100).toFixed(2)) : 0);

    const result = await this.pool.query<any>(
      `INSERT INTO performance_metrics (
        content_id, views, engagement, conversions, engagement_rate, qualitative_feedback
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, content_id, views, engagement, conversions, engagement_rate,
                qualitative_feedback, recorded_at`,
      [
        input.contentId,
        views,
        engagement,
        conversions,
        engagementRate,
        input.qualitativeFeedback || null,
      ]
    );

    return this.mapRowToPerformanceMetrics(result.rows[0]);
  }

  /**
   * Find a performance metrics entry by ID
   * @param id - Performance metrics ID
   * @returns Promise resolving to the performance metrics or null if not found
   */
  async findById(id: string): Promise<PerformanceMetrics | null> {
    const result = await this.pool.query<any>(
      `SELECT id, content_id, views, engagement, conversions, engagement_rate,
              qualitative_feedback, recorded_at
       FROM performance_metrics
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPerformanceMetrics(result.rows[0]);
  }

  /**
   * Find all performance metrics for a content piece
   * @param contentId - Content ID
   * @returns Promise resolving to an array of performance metrics
   */
  async findByContentId(contentId: string): Promise<PerformanceMetrics[]> {
    const result = await this.pool.query<any>(
      `SELECT id, content_id, views, engagement, conversions, engagement_rate,
              qualitative_feedback, recorded_at
       FROM performance_metrics
       WHERE content_id = $1
       ORDER BY recorded_at DESC`,
      [contentId]
    );

    return result.rows.map((row) => this.mapRowToPerformanceMetrics(row));
  }

  /**
   * Get the latest performance metrics for a content piece
   * @param contentId - Content ID
   * @returns Promise resolving to the latest performance metrics or null if not found
   */
  async getLatestByContentId(
    contentId: string
  ): Promise<PerformanceMetrics | null> {
    const result = await this.pool.query<any>(
      `SELECT id, content_id, views, engagement, conversions, engagement_rate,
              qualitative_feedback, recorded_at
       FROM performance_metrics
       WHERE content_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [contentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPerformanceMetrics(result.rows[0]);
  }

  /**
   * Update a performance metrics entry
   * @param id - Performance metrics ID
   * @param input - Performance metrics update data
   * @returns Promise resolving to the updated performance metrics or null if not found
   */
  async updatePerformanceMetrics(
    id: string,
    input: UpdatePerformanceMetricsInput
  ): Promise<PerformanceMetrics | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Get current metrics to recalculate engagement rate if needed
    const current = await this.findById(id);
    if (!current) {
      return null;
    }

    const views = input.views ?? current.views;
    const engagement = input.engagement ?? current.engagement;

    if (input.views !== undefined) {
      updates.push(`views = $${paramCount++}`);
      values.push(input.views);
    }

    if (input.engagement !== undefined) {
      updates.push(`engagement = $${paramCount++}`);
      values.push(input.engagement);
    }

    if (input.conversions !== undefined) {
      updates.push(`conversions = $${paramCount++}`);
      values.push(input.conversions);
    }

    // Recalculate engagement rate if views or engagement changed
    if (input.views !== undefined || input.engagement !== undefined) {
      const engagementRate =
        input.engagementRate ??
        (views > 0 ? parseFloat(((engagement / views) * 100).toFixed(2)) : 0);
      updates.push(`engagement_rate = $${paramCount++}`);
      values.push(engagementRate);
    } else if (input.engagementRate !== undefined) {
      updates.push(`engagement_rate = $${paramCount++}`);
      values.push(input.engagementRate);
    }

    if (input.qualitativeFeedback !== undefined) {
      updates.push(`qualitative_feedback = $${paramCount++}`);
      values.push(input.qualitativeFeedback);
    }

    if (updates.length === 0) {
      return current;
    }

    values.push(id);

    const result = await this.pool.query<any>(
      `UPDATE performance_metrics
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, content_id, views, engagement, conversions, engagement_rate,
                 qualitative_feedback, recorded_at`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPerformanceMetrics(result.rows[0]);
  }

  /**
   * Delete a performance metrics entry
   * @param id - Performance metrics ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deletePerformanceMetrics(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM performance_metrics WHERE id = $1`,
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Map database row to PerformanceMetrics object
   * @param row - Database row
   * @returns PerformanceMetrics object
   */
  private mapRowToPerformanceMetrics(row: any): PerformanceMetrics {
    return {
      id: row.id,
      contentId: row.content_id,
      views: row.views,
      engagement: row.engagement,
      conversions: row.conversions,
      engagementRate: parseFloat(row.engagement_rate),
      qualitativeFeedback: row.qualitative_feedback,
      recordedAt: row.recorded_at,
    };
  }
}
