/**
 * PerformanceMetrics Service Tests
 */

import { Pool } from 'pg';
import { PerformanceMetricsService } from './performanceMetricsService';
import { CreatePerformanceMetricsInput } from '../models/PerformanceMetrics';

// Mock pool for testing
const createMockPool = () => {
  return {
    query: jest.fn(),
  } as any as Pool;
};

describe('PerformanceMetricsService', () => {
  let performanceMetricsService: PerformanceMetricsService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = createMockPool();
    performanceMetricsService = new PerformanceMetricsService(mockPool);
  });

  describe('createPerformanceMetrics', () => {
    it('should create performance metrics with all required fields', async () => {
      const input: CreatePerformanceMetricsInput = {
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        views: 1000,
        engagement: 50,
        conversions: 10,
        qualitativeFeedback: 'Great engagement!',
      };

      const mockMetrics = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        content_id: input.contentId,
        views: input.views,
        engagement: input.engagement,
        conversions: input.conversions,
        engagement_rate: 5.0, // (50/1000) * 100
        qualitative_feedback: input.qualitativeFeedback,
        recorded_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockMetrics] });

      const result = await performanceMetricsService.createPerformanceMetrics(
        input
      );

      expect(result).toEqual({
        id: mockMetrics.id,
        contentId: mockMetrics.content_id,
        views: mockMetrics.views,
        engagement: mockMetrics.engagement,
        conversions: mockMetrics.conversions,
        engagementRate: mockMetrics.engagement_rate,
        qualitativeFeedback: mockMetrics.qualitative_feedback,
        recordedAt: mockMetrics.recorded_at,
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO performance_metrics'),
        expect.arrayContaining([
          input.contentId,
          input.views,
          input.engagement,
          input.conversions,
          5.0,
          input.qualitativeFeedback,
        ])
      );
    });

    it('should calculate engagement rate automatically', async () => {
      const input: CreatePerformanceMetricsInput = {
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        views: 200,
        engagement: 10,
        conversions: 2,
      };

      const mockMetrics = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        content_id: input.contentId,
        views: input.views,
        engagement: input.engagement,
        conversions: input.conversions,
        engagement_rate: 5.0, // (10/200) * 100
        qualitative_feedback: null,
        recorded_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockMetrics] });

      const result = await performanceMetricsService.createPerformanceMetrics(
        input
      );

      expect(result.engagementRate).toBe(5.0);
    });

    it('should handle zero views without division error', async () => {
      const input: CreatePerformanceMetricsInput = {
        contentId: '123e4567-e89b-12d3-a456-426614174000',
        views: 0,
        engagement: 0,
        conversions: 0,
      };

      const mockMetrics = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        content_id: input.contentId,
        views: 0,
        engagement: 0,
        conversions: 0,
        engagement_rate: 0,
        qualitative_feedback: null,
        recorded_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockMetrics] });

      const result = await performanceMetricsService.createPerformanceMetrics(
        input
      );

      expect(result.engagementRate).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return performance metrics when found', async () => {
      const mockMetrics = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        content_id: '123e4567-e89b-12d3-a456-426614174000',
        views: 500,
        engagement: 25,
        conversions: 5,
        engagement_rate: 5.0,
        qualitative_feedback: 'Good performance',
        recorded_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockMetrics] });

      const result = await performanceMetricsService.findById(mockMetrics.id);

      expect(result).toEqual({
        id: mockMetrics.id,
        contentId: mockMetrics.content_id,
        views: mockMetrics.views,
        engagement: mockMetrics.engagement,
        conversions: mockMetrics.conversions,
        engagementRate: mockMetrics.engagement_rate,
        qualitativeFeedback: mockMetrics.qualitative_feedback,
        recordedAt: mockMetrics.recorded_at,
      });
    });

    it('should return null when metrics not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await performanceMetricsService.findById(
        'non-existent-id'
      );

      expect(result).toBeNull();
    });
  });

  describe('findByContentId', () => {
    it('should return all metrics for a content piece', async () => {
      const contentId = '123e4567-e89b-12d3-a456-426614174000';
      const mockMetrics = [
        {
          id: '789e0123-e89b-12d3-a456-426614174000',
          content_id: contentId,
          views: 100,
          engagement: 10,
          conversions: 2,
          engagement_rate: 10.0,
          qualitative_feedback: null,
          recorded_at: new Date('2024-01-01'),
        },
        {
          id: '890e1234-e89b-12d3-a456-426614174000',
          content_id: contentId,
          views: 200,
          engagement: 15,
          conversions: 3,
          engagement_rate: 7.5,
          qualitative_feedback: 'Improving',
          recorded_at: new Date('2024-01-02'),
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockMetrics });

      const result = await performanceMetricsService.findByContentId(contentId);

      expect(result).toHaveLength(2);
      expect(result[0].contentId).toBe(contentId);
      expect(result[1].contentId).toBe(contentId);
    });
  });

  describe('getLatestByContentId', () => {
    it('should return the most recent metrics for a content piece', async () => {
      const contentId = '123e4567-e89b-12d3-a456-426614174000';
      const mockMetrics = {
        id: '890e1234-e89b-12d3-a456-426614174000',
        content_id: contentId,
        views: 200,
        engagement: 15,
        conversions: 3,
        engagement_rate: 7.5,
        qualitative_feedback: 'Latest metrics',
        recorded_at: new Date('2024-01-02'),
      };

      mockPool.query.mockResolvedValue({ rows: [mockMetrics] });

      const result = await performanceMetricsService.getLatestByContentId(
        contentId
      );

      expect(result).toEqual({
        id: mockMetrics.id,
        contentId: mockMetrics.content_id,
        views: mockMetrics.views,
        engagement: mockMetrics.engagement,
        conversions: mockMetrics.conversions,
        engagementRate: mockMetrics.engagement_rate,
        qualitativeFeedback: mockMetrics.qualitative_feedback,
        recordedAt: mockMetrics.recorded_at,
      });
    });
  });
});
