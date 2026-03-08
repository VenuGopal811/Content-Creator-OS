import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Pool } from 'pg';
import { ContentService } from '../services/contentService';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const createContentSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Title is required').max(500),
  body: z.string().min(1, 'Body is required'),
  tone: z.string().optional(),
  stage: z.string().optional(),
});

const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500).optional(),
  body: z.string().min(1, 'Body is required').optional(),
  tone: z.string().optional(),
  stage: z.string().optional(),
  engagementScore: z.any().optional(),
});

export function createContentRouter(pool: Pool): Router {
  const router = Router();
  const contentService = new ContentService(pool);

  router.use(authMiddleware);

  // POST /api/content
  router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const validationResult = createContentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new AppError(400, 'VALIDATION_ERROR', validationResult.error.errors[0].message);
      }

      const content = await contentService.createContent({
        ...validationResult.data,
        stage: validationResult.data.stage as any, // Cast string to 'LifecycleStage'
        userId: authReq.userId!,
      });

      res.status(201).json({ content });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/content/project/:projectId
  router.get('/project/:projectId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { projectId } = req.params;
      
      const contents = await contentService.findByProjectId(projectId);
      
      // Filter out contents that don't belong to the user
      const userContents = contents.filter(c => c.userId === authReq.userId);

      res.status(200).json({ contents: userContents });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/content/:id
  router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      
      const content = await contentService.findById(id);
      
      if (!content || content.userId !== authReq.userId) {
        throw new AppError(404, 'CONTENT_NOT_FOUND', 'Content not found');
      }

      res.status(200).json({ content });
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/content/:id
  router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      
      const validationResult = updateContentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new AppError(400, 'VALIDATION_ERROR', validationResult.error.errors[0].message);
      }

      const existingContent = await contentService.findById(id);
      
      if (!existingContent || existingContent.userId !== authReq.userId) {
        throw new AppError(404, 'CONTENT_NOT_FOUND', 'Content not found');
      }

      const content = await contentService.updateContent(id, validationResult.data as any);

      res.status(200).json({ content });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
