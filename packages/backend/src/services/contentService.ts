/**
 * Content Service
 * Handles database operations for Content entities
 */

import { Pool } from 'pg';
import {
  Content,
  CreateContentInput,
  UpdateContentInput,
  ContentMetadata,
  EngagementScore,
} from '../models/Content';

export class ContentService {
  constructor(private pool: Pool) {}

  /**
   * Create a new content piece
   * @param input - Content creation data
   * @returns Promise resolving to the created content
   */
  async createContent(input: CreateContentInput): Promise<Content> {
    const defaultMetadata: ContentMetadata = {
      wordCount: this.calculateWordCount(input.body),
      readingTime: this.calculateReadingTime(input.body),
      tags: [],
      ...input.metadata,
    };

    const result = await this.pool.query<any>(
      `INSERT INTO content (
        project_id, user_id, title, body, tone, persona, stage,
        source_content_id, target_format, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, project_id, user_id, title, body, tone, persona, stage,
                source_content_id, target_format, engagement_score, published_at,
                created_at, updated_at, version, metadata`,
      [
        input.projectId,
        input.userId,
        input.title,
        input.body,
        input.tone || null,
        input.persona || null,
        input.stage || 'draft',
        input.sourceContentId || null,
        input.targetFormat || null,
        JSON.stringify(defaultMetadata),
      ]
    );

    return this.mapRowToContent(result.rows[0]);
  }

  /**
   * Find a content piece by ID
   * @param id - Content ID
   * @returns Promise resolving to the content or null if not found
   */
  async findById(id: string): Promise<Content | null> {
    const result = await this.pool.query<any>(
      `SELECT id, project_id, user_id, title, body, tone, persona, stage,
              source_content_id, target_format, engagement_score, published_at,
              created_at, updated_at, version, metadata
       FROM content
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToContent(result.rows[0]);
  }

  /**
   * Find all content for a project
   * @param projectId - Project ID
   * @param stage - Optional filter by lifecycle stage
   * @returns Promise resolving to an array of content
   */
  async findByProjectId(
    projectId: string,
    stage?: string
  ): Promise<Content[]> {
    const query = stage
      ? `SELECT id, project_id, user_id, title, body, tone, persona, stage,
                source_content_id, target_format, engagement_score, published_at,
                created_at, updated_at, version, metadata
         FROM content
         WHERE project_id = $1 AND stage = $2
         ORDER BY updated_at DESC`
      : `SELECT id, project_id, user_id, title, body, tone, persona, stage,
                source_content_id, target_format, engagement_score, published_at,
                created_at, updated_at, version, metadata
         FROM content
         WHERE project_id = $1
         ORDER BY updated_at DESC`;

    const params = stage ? [projectId, stage] : [projectId];
    const result = await this.pool.query<any>(query, params);

    return result.rows.map((row) => this.mapRowToContent(row));
  }

  /**
   * Find all content for a user
   * @param userId - User ID
   * @param stage - Optional filter by lifecycle stage
   * @returns Promise resolving to an array of content
   */
  async findByUserId(userId: string, stage?: string): Promise<Content[]> {
    const query = stage
      ? `SELECT id, project_id, user_id, title, body, tone, persona, stage,
                source_content_id, target_format, engagement_score, published_at,
                created_at, updated_at, version, metadata
         FROM content
         WHERE user_id = $1 AND stage = $2
         ORDER BY updated_at DESC`
      : `SELECT id, project_id, user_id, title, body, tone, persona, stage,
                source_content_id, target_format, engagement_score, published_at,
                created_at, updated_at, version, metadata
         FROM content
         WHERE user_id = $1
         ORDER BY updated_at DESC`;

    const params = stage ? [userId, stage] : [userId];
    const result = await this.pool.query<any>(query, params);

    return result.rows.map((row) => this.mapRowToContent(row));
  }

  /**
   * Update a content piece
   * @param id - Content ID
   * @param input - Content update data
   * @returns Promise resolving to the updated content or null if not found
   */
  async updateContent(
    id: string,
    input: UpdateContentInput
  ): Promise<Content | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(input.title);
    }

    if (input.body !== undefined) {
      updates.push(`body = $${paramCount++}`);
      values.push(input.body);

      // Recalculate metadata if body changes
      const currentContent = await this.findById(id);
      if (currentContent) {
        const updatedMetadata = {
          ...currentContent.metadata,
          wordCount: this.calculateWordCount(input.body),
          readingTime: this.calculateReadingTime(input.body),
          ...input.metadata,
        };
        updates.push(`metadata = $${paramCount++}`);
        values.push(JSON.stringify(updatedMetadata));
      }
    } else if (input.metadata !== undefined) {
      const currentContent = await this.findById(id);
      if (currentContent) {
        const updatedMetadata = {
          ...currentContent.metadata,
          ...input.metadata,
        };
        updates.push(`metadata = $${paramCount++}`);
        values.push(JSON.stringify(updatedMetadata));
      }
    }

    if (input.tone !== undefined) {
      updates.push(`tone = $${paramCount++}`);
      values.push(input.tone);
    }

    if (input.persona !== undefined) {
      updates.push(`persona = $${paramCount++}`);
      values.push(input.persona);
    }

    if (input.stage !== undefined) {
      updates.push(`stage = $${paramCount++}`);
      values.push(input.stage);
    }

    if (input.targetFormat !== undefined) {
      updates.push(`target_format = $${paramCount++}`);
      values.push(input.targetFormat);
    }

    if (input.engagementScore !== undefined) {
      updates.push(`engagement_score = $${paramCount++}`);
      values.push(JSON.stringify(input.engagementScore));
    }

    if (input.publishedAt !== undefined) {
      updates.push(`published_at = $${paramCount++}`);
      values.push(input.publishedAt);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // Always update the updated_at timestamp and increment version
    updates.push(`updated_at = NOW()`);
    updates.push(`version = version + 1`);
    values.push(id);

    const result = await this.pool.query<any>(
      `UPDATE content
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, project_id, user_id, title, body, tone, persona, stage,
                 source_content_id, target_format, engagement_score, published_at,
                 created_at, updated_at, version, metadata`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToContent(result.rows[0]);
  }

  /**
   * Delete a content piece
   * @param id - Content ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteContent(id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM content WHERE id = $1`, [
      id,
    ]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Calculate word count from text
   * @param text - Text content
   * @returns Word count
   */
  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Calculate reading time in minutes
   * @param text - Text content
   * @returns Reading time in minutes (assumes 200 words per minute)
   */
  private calculateReadingTime(text: string): number {
    const wordCount = this.calculateWordCount(text);
    return Math.ceil(wordCount / 200);
  }

  /**
   * Map database row to Content object
   * @param row - Database row
   * @returns Content object
   */
  private mapRowToContent(row: any): Content {
    return {
      id: row.id,
      projectId: row.project_id,
      userId: row.user_id,
      title: row.title,
      body: row.body,
      tone: row.tone,
      persona: row.persona,
      stage: row.stage,
      sourceContentId: row.source_content_id,
      targetFormat: row.target_format,
      engagementScore: row.engagement_score,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      metadata: row.metadata,
    };
  }
}
