/**
 * Feedback Service Tests
 */

import { Pool } from 'pg';
import { FeedbackService } from './feedbackService';
import { CreateFeedbackInput } from '../models/Feedback';

// Mock pool for testing
const createMockPool = () => {
  return {
    query: jest.fn(),
  } as any as Pool;
};

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = createMockPool();
    feedbackService = new FeedbackService(mockPool);
  });

  describe('createFeedback', () => {
    it('should create feedback with all required fields', async () => {
      const input: CreateFeedbackInput = {
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174000',
        type: 'suggestion_acceptance',
        data: { suggestionId: 'test-123', accepted: true },
      };

      const mockFeedback = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        content_id: input.contentId,
        user_id: input.userId,
        type: input.type,
        data: input.data,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockFeedback] });

      const result = await feedbackService.createFeedback(input);

      expect(result).toEqual({
        id: mockFeedback.id,
        contentId: mockFeedback.content_id,
        userId: mockFeedback.user_id,
        type: mockFeedback.type,
        data: mockFeedback.data,
        createdAt: mockFeedback.created_at,
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO feedback'),
        [input.contentId, input.userId, input.type, JSON.stringify(input.data)]
      );
    });
  });

  describe('findById', () => {
    it('should return feedback when found', async () => {
      const mockFeedback = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        content_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        type: 'performance_data',
        data: { views: 100, engagement: 50 },
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockFeedback] });

      const result = await feedbackService.findById(mockFeedback.id);

      expect(result).toEqual({
        id: mockFeedback.id,
        contentId: mockFeedback.content_id,
        userId: mockFeedback.user_id,
        type: mockFeedback.type,
        data: mockFeedback.data,
        createdAt: mockFeedback.created_at,
      });
    });

    it('should return null when feedback not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await feedbackService.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByContentId', () => {
    it('should return all feedback for a content piece', async () => {
      const contentId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFeedbacks = [
        {
          id: '789e0123-e89b-12d3-a456-426614174000',
          content_id: contentId,
          user_id: '456e7890-e89b-12d3-a456-426614174000',
          type: 'suggestion_acceptance',
          data: { accepted: true },
          created_at: new Date(),
        },
        {
          id: '890e1234-e89b-12d3-a456-426614174000',
          content_id: contentId,
          user_id: '456e7890-e89b-12d3-a456-426614174000',
          type: 'suggestion_rejection',
          data: { rejected: true },
          created_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockFeedbacks });

      const result = await feedbackService.findByContentId(contentId);

      expect(result).toHaveLength(2);
      expect(result[0].contentId).toBe(contentId);
      expect(result[1].contentId).toBe(contentId);
    });
  });
});
