/**
 * Idea Service
 * Handles database operations for Idea entities
 */

import { Pool } from 'pg';
import { Idea, CreateIdeaInput, UpdateIdeaInput } from '../models/Idea';

export class IdeaService {
  constructor(private pool: Pool) {}

  /**
   * Create a new idea
   * @param input - Idea creation data
   * @returns Promise resolving to the created idea
   */
  async createIdea(input: CreateIdeaInput): Promise<Idea> {
    const result = await this.pool.query<Idea>(
      `INSERT INTO ideas (project_id, title, description, rationale)
       VALUES ($1, $2, $3, $4)
       RETURNING id, project_id, title, description, rationale, selected, created_at`,
      [input.projectId, input.title, input.description, input.rationale]
    );

    return this.mapRowToIdea(result.rows[0]);
  }

  /**
   * Find an idea by ID
   * @param id - Idea ID
   * @returns Promise resolving to the idea or null if not found
   */
  async findById(id: string): Promise<Idea | null> {
    const result = await this.pool.query<Idea>(
      `SELECT id, project_id, title, description, rationale, selected, created_at
       FROM ideas
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToIdea(result.rows[0]);
  }

  /**
   * Find all ideas for a project
   * @param projectId - Project ID
   * @returns Promise resolving to an array of ideas
   */
  async findByProjectId(projectId: string): Promise<Idea[]> {
    const result = await this.pool.query<Idea>(
      `SELECT id, project_id, title, description, rationale, selected, created_at
       FROM ideas
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    return result.rows.map((row) => this.mapRowToIdea(row));
  }

  /**
   * Update an idea
   * @param id - Idea ID
   * @param input - Idea update data
   * @returns Promise resolving to the updated idea or null if not found
   */
  async updateIdea(id: string, input: UpdateIdeaInput): Promise<Idea | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(input.title);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(input.description);
    }

    if (input.rationale !== undefined) {
      updates.push(`rationale = $${paramCount++}`);
      values.push(input.rationale);
    }

    if (input.selected !== undefined) {
      updates.push(`selected = $${paramCount++}`);
      values.push(input.selected);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.pool.query<Idea>(
      `UPDATE ideas
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, project_id, title, description, rationale, selected, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToIdea(result.rows[0]);
  }

  /**
   * Mark an idea as selected
   * @param id - Idea ID
   * @returns Promise resolving to the updated idea or null if not found
   */
  async selectIdea(id: string): Promise<Idea | null> {
    return this.updateIdea(id, { selected: true });
  }

  /**
   * Delete an idea
   * @param id - Idea ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteIdea(id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM ideas WHERE id = $1`, [
      id,
    ]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Map database row to Idea object
   * @param row - Database row
   * @returns Idea object
   */
  private mapRowToIdea(row: any): Idea {
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      rationale: row.rationale,
      selected: row.selected,
      createdAt: row.created_at,
    };
  }
}
