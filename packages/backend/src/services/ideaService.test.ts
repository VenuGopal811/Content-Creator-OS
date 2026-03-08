/**
 * Idea Service Tests
 */

import { Pool } from 'pg';
import { IdeaService } from './ideaService';
import { CreateIdeaInput, UpdateIdeaInput } from '../models/Idea';

// Mock pool for testing
const createMockPool = () => {
  return {
    query: jest.fn(),
  } as any as Pool;
};

describe('IdeaService', () => {
  let ideaService: IdeaService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = createMockPool();
    ideaService = new IdeaService(mockPool);
  });

  describe('createIdea', () => {
    it('should create an idea with all required fields', async () => {
      const input: CreateIdeaInput = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Idea',
        description: 'Test Description',
        rationale: 'Test Rationale',
      };

      const mockIdea = {
        id: '456e7890-e89b-12d3-a456-426614174000',
        project_id: input.projectId,
        title: input.title,
        description: input.description,
        rationale: input.rationale,
        selected: false,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockIdea],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.createIdea(input);

      expect(result).toEqual({
        id: mockIdea.id,
        projectId: mockIdea.project_id,
        title: mockIdea.title,
        description: mockIdea.description,
        rationale: mockIdea.rationale,
        selected: mockIdea.selected,
        createdAt: mockIdea.created_at,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ideas'),
        [input.projectId, input.title, input.description, input.rationale]
      );
    });
  });

  describe('findById', () => {
    it('should find an idea by ID', async () => {
      const ideaId = '456e7890-e89b-12d3-a456-426614174000';
      const mockIdea = {
        id: ideaId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Idea',
        description: 'Test Description',
        rationale: 'Test Rationale',
        selected: false,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockIdea],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.findById(ideaId);

      expect(result).toEqual({
        id: mockIdea.id,
        projectId: mockIdea.project_id,
        title: mockIdea.title,
        description: mockIdea.description,
        rationale: mockIdea.rationale,
        selected: mockIdea.selected,
        createdAt: mockIdea.created_at,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [ideaId]
      );
    });

    it('should return null if idea not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should find all ideas for a project ordered by created_at DESC', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);

      const mockIdeas = [
        {
          id: '456e7890-e89b-12d3-a456-426614174001',
          project_id: projectId,
          title: 'Recent Idea',
          description: 'Most recent',
          rationale: 'Recent rationale',
          selected: false,
          created_at: now,
        },
        {
          id: '456e7890-e89b-12d3-a456-426614174002',
          project_id: projectId,
          title: 'Older Idea',
          description: 'Older',
          rationale: 'Older rationale',
          selected: false,
          created_at: earlier,
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockIdeas,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.findByProjectId(projectId);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Recent Idea');
      expect(result[1].title).toBe('Older Idea');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [projectId]
      );
    });

    it('should return empty array if no ideas found', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.findByProjectId(projectId);

      expect(result).toEqual([]);
    });
  });

  describe('updateIdea', () => {
    it('should update idea title', async () => {
      const ideaId = '456e7890-e89b-12d3-a456-426614174000';
      const input: UpdateIdeaInput = {
        title: 'Updated Title',
      };

      const mockIdea = {
        id: ideaId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: input.title,
        description: 'Original Description',
        rationale: 'Original Rationale',
        selected: false,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockIdea],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.updateIdea(ideaId, input);

      expect(result?.title).toBe(input.title);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ideas'),
        expect.arrayContaining([input.title, ideaId])
      );
    });

    it('should update selected status', async () => {
      const ideaId = '456e7890-e89b-12d3-a456-426614174000';
      const input: UpdateIdeaInput = {
        selected: true,
      };

      const mockIdea = {
        id: ideaId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Idea',
        description: 'Test Description',
        rationale: 'Test Rationale',
        selected: true,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockIdea],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.updateIdea(ideaId, input);

      expect(result?.selected).toBe(true);
    });

    it('should return null if idea not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.updateIdea('nonexistent-id', {
        title: 'New Title',
      });

      expect(result).toBeNull();
    });
  });

  describe('selectIdea', () => {
    it('should mark an idea as selected', async () => {
      const ideaId = '456e7890-e89b-12d3-a456-426614174000';

      const mockIdea = {
        id: ideaId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Idea',
        description: 'Test Description',
        rationale: 'Test Rationale',
        selected: true,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockIdea],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.selectIdea(ideaId);

      expect(result?.selected).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ideas'),
        expect.arrayContaining([true, ideaId])
      );
    });

    it('should return null if idea not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.selectIdea('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteIdea', () => {
    it('should delete an idea', async () => {
      const ideaId = '456e7890-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.deleteIdea(ideaId);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM ideas'),
        [ideaId]
      );
    });

    it('should return false if idea not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await ideaService.deleteIdea('nonexistent-id');

      expect(result).toBe(false);
    });
  });
});
