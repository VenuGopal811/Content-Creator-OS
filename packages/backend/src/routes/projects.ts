/**
 * Project Routes
 * Handles project CRUD operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/projectService';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Pool } from 'pg';

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
});

export function createProjectRouter(pool: Pool): Router {
  const router = Router();
  const projectService = new ProjectService(pool);

  // Apply auth middleware to all project routes
  router.use(authMiddleware);

  /**
   * POST /api/projects
   * Create a new project
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      
      // Validate request body
      const validationResult = createProjectSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          firstError.message,
          { field: firstError.path.join('.') }
        );
      }

      const { name, description } = validationResult.data;

      // Create project
      const project = await projectService.createProject({
        userId: authReq.userId!,
        name,
        description,
      });

      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/projects
   * List user's projects (ordered by updatedAt DESC)
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const includeArchived = req.query.includeArchived === 'true';
      
      const projects = await projectService.findByUserId(
        authReq.userId!,
        includeArchived
      );

      res.status(200).json({ projects });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/projects/:id
   * Update project metadata
   */
  router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      // Validate request body
      const validationResult = updateProjectSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          firstError.message,
          { field: firstError.path.join('.') }
        );
      }

      // Check if project exists and belongs to user
      const existingProject = await projectService.findById(id);
      if (!existingProject) {
        throw new AppError(
          404,
          'PROJECT_NOT_FOUND',
          'The requested project was not found.'
        );
      }

      if (existingProject.userId !== authReq.userId) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'You do not have permission to update this project.'
        );
      }

      // Update project
      const project = await projectService.updateProject(id, validationResult.data);

      res.status(200).json({ project });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/projects/:id
   * Delete project
   */
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      // Check if project exists and belongs to user
      const existingProject = await projectService.findById(id);
      if (!existingProject) {
        throw new AppError(
          404,
          'PROJECT_NOT_FOUND',
          'The requested project was not found.'
        );
      }

      if (existingProject.userId !== authReq.userId) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'You do not have permission to delete this project.'
        );
      }

      // Delete project
      await projectService.deleteProject(id);

      res.status(200).json({ 
        message: 'Project deleted successfully.',
        deletedProjectId: id 
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/projects/:id/archive
   * Archive project
   */
  router.post('/:id/archive', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      // Check if project exists and belongs to user
      const existingProject = await projectService.findById(id);
      if (!existingProject) {
        throw new AppError(
          404,
          'PROJECT_NOT_FOUND',
          'The requested project was not found.'
        );
      }

      if (existingProject.userId !== authReq.userId) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'You do not have permission to archive this project.'
        );
      }

      // Archive project
      const project = await projectService.archiveProject(id);

      res.status(200).json({ 
        message: 'Project archived successfully.',
        project 
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
