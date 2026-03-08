/**
 * Project Service
 * Handles database operations for Project entities
 */

import { Pool } from 'pg';
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from '../models/Project';

export class ProjectService {
  constructor(private pool: Pool) {}

  /**
   * Create a new project
   * @param input - Project creation data
   * @returns Promise resolving to the created project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    const result = await this.pool.query<Project>(
      `INSERT INTO projects (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, description, archived, created_at, updated_at`,
      [input.userId, input.name, input.description || null]
    );

    return this.mapRowToProject(result.rows[0]);
  }

  /**
   * Find a project by ID
   * @param id - Project ID
   * @returns Promise resolving to the project or null if not found
   */
  async findById(id: string): Promise<Project | null> {
    const result = await this.pool.query<Project>(
      `SELECT id, user_id, name, description, archived, created_at, updated_at
       FROM projects
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  /**
   * Find all projects for a user, ordered by last modified date
   * @param userId - User ID
   * @param includeArchived - Whether to include archived projects (default: false)
   * @returns Promise resolving to an array of projects
   */
  async findByUserId(
    userId: string,
    includeArchived: boolean = false
  ): Promise<Project[]> {
    const query = includeArchived
      ? `SELECT id, user_id, name, description, archived, created_at, updated_at
         FROM projects
         WHERE user_id = $1
         ORDER BY updated_at DESC`
      : `SELECT id, user_id, name, description, archived, created_at, updated_at
         FROM projects
         WHERE user_id = $1 AND archived = false
         ORDER BY updated_at DESC`;

    const result = await this.pool.query<Project>(query, [userId]);

    return result.rows.map((row) => this.mapRowToProject(row));
  }

  /**
   * Update a project
   * @param id - Project ID
   * @param input - Project update data
   * @returns Promise resolving to the updated project or null if not found
   */
  async updateProject(
    id: string,
    input: UpdateProjectInput
  ): Promise<Project | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(input.name);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(input.description);
    }

    if (input.archived !== undefined) {
      updates.push(`archived = $${paramCount++}`);
      values.push(input.archived);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query<Project>(
      `UPDATE projects
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, user_id, name, description, archived, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  /**
   * Archive a project
   * @param id - Project ID
   * @returns Promise resolving to the archived project or null if not found
   */
  async archiveProject(id: string): Promise<Project | null> {
    return this.updateProject(id, { archived: true });
  }

  /**
   * Delete a project (and all associated content via CASCADE)
   * @param id - Project ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteProject(id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM projects WHERE id = $1`, [
      id,
    ]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Map database row to Project object
   * @param row - Database row
   * @returns Project object
   */
  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      archived: row.archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
