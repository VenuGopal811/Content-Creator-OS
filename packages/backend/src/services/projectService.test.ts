/**
 * Project Service Tests
 */

import { Pool } from 'pg';
import { ProjectService } from './projectService';
import { CreateProjectInput, UpdateProjectInput } from '../models/Project';

// Mock pool for testing
const createMockPool = () => {
  return {
    query: jest.fn(),
  } as any as Pool;
};

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = createMockPool();
    projectService = new ProjectService(mockPool);
  });

  describe('createProject', () => {
    it('should create a project with all required fields', async () => {
      const input: CreateProjectInput = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        description: 'Test Description',
      };

      const mockProject = {
        id: '456e7890-e89b-12d3-a456-426614174000',
        user_id: input.userId,
        name: input.name,
        description: input.description,
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.createProject(input);

      expect(result).toEqual({
        id: mockProject.id,
        userId: mockProject.user_id,
        name: mockProject.name,
        description: mockProject.description,
        archived: mockProject.archived,
        createdAt: mockProject.created_at,
        updatedAt: mockProject.updated_at,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        [input.userId, input.name, input.description]
      );
    });

    it('should create a project without description', async () => {
      const input: CreateProjectInput = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
      };

      const mockProject = {
        id: '456e7890-e89b-12d3-a456-426614174000',
        user_id: input.userId,
        name: input.name,
        description: null,
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.createProject(input);

      expect(result.description).toBeNull();
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        [input.userId, input.name, null]
      );
    });
  });

  describe('findById', () => {
    it('should find a project by ID', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';
      const mockProject = {
        id: projectId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        description: 'Test Description',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.findById(projectId);

      expect(result).toEqual({
        id: mockProject.id,
        userId: mockProject.user_id,
        name: mockProject.name,
        description: mockProject.description,
        archived: mockProject.archived,
        createdAt: mockProject.created_at,
        updatedAt: mockProject.updated_at,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [projectId]
      );
    });

    it('should return null if project not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await projectService.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all non-archived projects for a user ordered by updated_at DESC', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);

      const mockProjects = [
        {
          id: '456e7890-e89b-12d3-a456-426614174001',
          user_id: userId,
          name: 'Recent Project',
          description: 'Most recent',
          archived: false,
          created_at: earlier,
          updated_at: now,
        },
        {
          id: '456e7890-e89b-12d3-a456-426614174002',
          user_id: userId,
          name: 'Older Project',
          description: 'Older',
          archived: false,
          created_at: earlier,
          updated_at: earlier,
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockProjects,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const result = await projectService.findByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Recent Project');
      expect(result[1].name).toBe('Older Project');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY updated_at DESC'),
        [userId]
      );
    });

    it('should exclude archived projects by default', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await projectService.findByUserId(userId);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('archived = false'),
        [userId]
      );
    });

    it('should include archived projects when requested', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await projectService.findByUserId(userId, true);

      const query = mockPool.query.mock.calls[0][0];
      expect(query).not.toContain('archived = false');
      expect(query).toContain('ORDER BY updated_at DESC');
    });

    it('should return empty array if no projects found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await projectService.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateProject', () => {
    it('should update project name', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';
      const input: UpdateProjectInput = {
        name: 'Updated Name',
      };

      const mockProject = {
        id: projectId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: input.name,
        description: 'Original Description',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.updateProject(projectId, input);

      expect(result?.name).toBe(input.name);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE projects'),
        expect.arrayContaining([input.name, projectId])
      );
    });

    it('should update project description', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';
      const input: UpdateProjectInput = {
        description: 'Updated Description',
      };

      const mockProject = {
        id: projectId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Original Name',
        description: input.description,
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.updateProject(projectId, input);

      expect(result?.description).toBe(input.description);
    });

    it('should update archived status', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';
      const input: UpdateProjectInput = {
        archived: true,
      };

      const mockProject = {
        id: projectId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        description: 'Test Description',
        archived: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.updateProject(projectId, input);

      expect(result?.archived).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';
      const input: UpdateProjectInput = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      const mockProject = {
        id: projectId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: input.name,
        description: input.description,
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.updateProject(projectId, input);

      expect(result?.name).toBe(input.name);
      expect(result?.description).toBe(input.description);
    });

    it('should always update updated_at timestamp', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';
      const input: UpdateProjectInput = {
        name: 'Updated Name',
      };

      const mockProject = {
        id: projectId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: input.name,
        description: 'Test Description',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await projectService.updateProject(projectId, input);

      const query = mockPool.query.mock.calls[0][0];
      expect(query).toContain('updated_at = NOW()');
    });

    it('should return null if project not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await projectService.updateProject('nonexistent-id', {
        name: 'New Name',
      });

      expect(result).toBeNull();
    });
  });

  describe('archiveProject', () => {
    it('should archive a project', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';

      const mockProject = {
        id: projectId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        description: 'Test Description',
        archived: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockProject],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.archiveProject(projectId);

      expect(result?.archived).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE projects'),
        expect.arrayContaining([true, projectId])
      );
    });

    it('should return null if project not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await projectService.archiveProject('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const projectId = '456e7890-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await projectService.deleteProject(projectId);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM projects'),
        [projectId]
      );
    });

    it('should return false if project not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await projectService.deleteProject('nonexistent-id');

      expect(result).toBe(false);
    });
  });
});
