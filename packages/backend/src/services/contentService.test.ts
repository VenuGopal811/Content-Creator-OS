/**
 * Content Service Tests
 */

import { Pool } from 'pg';
import { ContentService } from './contentService';
import { CreateContentInput, UpdateContentInput } from '../models/Content';

// Mock pool for testing
const createMockPool = () => {
  return {
    query: jest.fn(),
  } as any as Pool;
};

describe('ContentService', () => {
  let contentService: ContentService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = createMockPool();
    contentService = new ContentService(mockPool);
  });

  describe('createContent', () => {
    it('should create content with all required fields', async () => {
      const input: CreateContentInput = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test Content',
        body: 'This is test content with some words.',
        tone: 'professional',
        persona: 'expert',
      };

      const mockContent = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        project_id: input.projectId,
        user_id: input.userId,
        title: input.title,
        body: input.body,
        tone: input.tone,
        persona: input.persona,
        stage: 'draft',
        source_content_id: null,
        target_format: null,
        engagement_score: null,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        metadata: { wordCount: 7, readingTime: 1, tags: [] },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockContent],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.createContent(input);

      expect(result).toEqual({
        id: mockContent.id,
        projectId: mockContent.project_id,
        userId: mockContent.user_id,
        title: mockContent.title,
        body: mockContent.body,
        tone: mockContent.tone,
        persona: mockContent.persona,
        stage: mockContent.stage,
        sourceContentId: mockContent.source_content_id,
        targetFormat: mockContent.target_format,
        engagementScore: mockContent.engagement_score,
        publishedAt: mockContent.published_at,
        createdAt: mockContent.created_at,
        updatedAt: mockContent.updated_at,
        version: mockContent.version,
        metadata: mockContent.metadata,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO content'),
        expect.arrayContaining([
          input.projectId,
          input.userId,
          input.title,
          input.body,
          input.tone,
          input.persona,
          'draft',
        ])
      );
    });

    it('should calculate word count and reading time automatically', async () => {
      const input: CreateContentInput = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test Content',
        body: 'This is a test with exactly ten words here.',
      };

      const mockContent = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        project_id: input.projectId,
        user_id: input.userId,
        title: input.title,
        body: input.body,
        tone: null,
        persona: null,
        stage: 'draft',
        source_content_id: null,
        target_format: null,
        engagement_score: null,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        metadata: { wordCount: 10, readingTime: 1, tags: [] },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockContent],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.createContent(input);

      expect(result.metadata.wordCount).toBe(10);
      expect(result.metadata.readingTime).toBe(1);
    });

    it('should use default stage "draft" if not provided', async () => {
      const input: CreateContentInput = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test Content',
        body: 'Test body',
      };

      const mockContent = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        project_id: input.projectId,
        user_id: input.userId,
        title: input.title,
        body: input.body,
        tone: null,
        persona: null,
        stage: 'draft',
        source_content_id: null,
        target_format: null,
        engagement_score: null,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        metadata: { wordCount: 2, readingTime: 1, tags: [] },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockContent],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.createContent(input);

      expect(result.stage).toBe('draft');
    });
  });

  describe('findById', () => {
    it('should find content by ID', async () => {
      const contentId = '789e0123-e89b-12d3-a456-426614174000';
      const mockContent = {
        id: contentId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test Content',
        body: 'Test body',
        tone: 'professional',
        persona: 'expert',
        stage: 'draft',
        source_content_id: null,
        target_format: null,
        engagement_score: null,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1,
        metadata: { wordCount: 2, readingTime: 1, tags: [] },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockContent],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.findById(contentId);

      expect(result).toEqual({
        id: mockContent.id,
        projectId: mockContent.project_id,
        userId: mockContent.user_id,
        title: mockContent.title,
        body: mockContent.body,
        tone: mockContent.tone,
        persona: mockContent.persona,
        stage: mockContent.stage,
        sourceContentId: mockContent.source_content_id,
        targetFormat: mockContent.target_format,
        engagementScore: mockContent.engagement_score,
        publishedAt: mockContent.published_at,
        createdAt: mockContent.created_at,
        updatedAt: mockContent.updated_at,
        version: mockContent.version,
        metadata: mockContent.metadata,
      });
    });

    it('should return null if content not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await contentService.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should find all content for a project ordered by updated_at DESC', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const now = new Date();
      const earlier = new Date(now.getTime() - 3600000);

      const mockContents = [
        {
          id: '789e0123-e89b-12d3-a456-426614174001',
          project_id: projectId,
          user_id: '456e7890-e89b-12d3-a456-426614174000',
          title: 'Recent Content',
          body: 'Recent',
          tone: null,
          persona: null,
          stage: 'draft',
          source_content_id: null,
          target_format: null,
          engagement_score: null,
          published_at: null,
          created_at: earlier,
          updated_at: now,
          version: 1,
          metadata: { wordCount: 1, readingTime: 1, tags: [] },
        },
        {
          id: '789e0123-e89b-12d3-a456-426614174002',
          project_id: projectId,
          user_id: '456e7890-e89b-12d3-a456-426614174000',
          title: 'Older Content',
          body: 'Older',
          tone: null,
          persona: null,
          stage: 'draft',
          source_content_id: null,
          target_format: null,
          engagement_score: null,
          published_at: null,
          created_at: earlier,
          updated_at: earlier,
          version: 1,
          metadata: { wordCount: 1, readingTime: 1, tags: [] },
        },
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockContents,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const result = await contentService.findByProjectId(projectId);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Recent Content');
      expect(result[1].title).toBe('Older Content');
    });

    it('should filter by stage when provided', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await contentService.findByProjectId(projectId, 'publish');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('stage = $2'),
        [projectId, 'publish']
      );
    });
  });

  describe('updateContent', () => {
    it('should update content title', async () => {
      const contentId = '789e0123-e89b-12d3-a456-426614174000';
      const input: UpdateContentInput = {
        title: 'Updated Title',
      };

      const mockContent = {
        id: contentId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        title: input.title,
        body: 'Original body',
        tone: null,
        persona: null,
        stage: 'draft',
        source_content_id: null,
        target_format: null,
        engagement_score: null,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 2,
        metadata: { wordCount: 2, readingTime: 1, tags: [] },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockContent],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.updateContent(contentId, input);

      expect(result?.title).toBe(input.title);
      expect(result?.version).toBe(2);
    });

    it('should recalculate metadata when body changes', async () => {
      const contentId = '789e0123-e89b-12d3-a456-426614174000';
      const input: UpdateContentInput = {
        body: 'This is a new body with more words than before.',
      };

      // Mock findById call
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: contentId,
            project_id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '456e7890-e89b-12d3-a456-426614174000',
            title: 'Test',
            body: 'Old body',
            tone: null,
            persona: null,
            stage: 'draft',
            source_content_id: null,
            target_format: null,
            engagement_score: null,
            published_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            version: 1,
            metadata: { wordCount: 2, readingTime: 1, tags: [] },
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Mock update call
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: contentId,
            project_id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '456e7890-e89b-12d3-a456-426614174000',
            title: 'Test',
            body: input.body,
            tone: null,
            persona: null,
            stage: 'draft',
            source_content_id: null,
            target_format: null,
            engagement_score: null,
            published_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            version: 2,
            metadata: { wordCount: 10, readingTime: 1, tags: [] },
          },
        ],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.updateContent(contentId, input);

      expect(result?.body).toBe(input.body);
      expect(result?.metadata.wordCount).toBe(10);
    });

    it('should update stage', async () => {
      const contentId = '789e0123-e89b-12d3-a456-426614174000';
      const input: UpdateContentInput = {
        stage: 'publish',
      };

      const mockContent = {
        id: contentId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test',
        body: 'Test body',
        tone: null,
        persona: null,
        stage: 'publish',
        source_content_id: null,
        target_format: null,
        engagement_score: null,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 2,
        metadata: { wordCount: 2, readingTime: 1, tags: [] },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockContent],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.updateContent(contentId, input);

      expect(result?.stage).toBe('publish');
    });

    it('should increment version on update', async () => {
      const contentId = '789e0123-e89b-12d3-a456-426614174000';
      const input: UpdateContentInput = {
        title: 'Updated',
      };

      const mockContent = {
        id: contentId,
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        title: input.title,
        body: 'Test body',
        tone: null,
        persona: null,
        stage: 'draft',
        source_content_id: null,
        target_format: null,
        engagement_score: null,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        version: 2,
        metadata: { wordCount: 2, readingTime: 1, tags: [] },
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockContent],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await contentService.updateContent(contentId, input);

      const query = mockPool.query.mock.calls[0][0];
      expect(query).toContain('version = version + 1');
    });

    it('should return null if content not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await contentService.updateContent('nonexistent-id', {
        title: 'New Title',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteContent', () => {
    it('should delete content', async () => {
      const contentId = '789e0123-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await contentService.deleteContent(contentId);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM content'),
        [contentId]
      );
    });

    it('should return false if content not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await contentService.deleteContent('nonexistent-id');

      expect(result).toBe(false);
    });
  });
});
