/**
 * PerformanceMetrics Model
 * Defines the PerformanceMetrics interface and types for the ContentOS platform
 */

export interface PerformanceMetrics {
  id: string;
  contentId: string;
  views: number;
  engagement: number;
  conversions: number;
  engagementRate: number;
  qualitativeFeedback?: string | null;
  recordedAt: Date;
}

export interface CreatePerformanceMetricsInput {
  contentId: string;
  views?: number;
  engagement?: number;
  conversions?: number;
  engagementRate?: number;
  qualitativeFeedback?: string;
}

export interface UpdatePerformanceMetricsInput {
  views?: number;
  engagement?: number;
  conversions?: number;
  engagementRate?: number;
  qualitativeFeedback?: string;
}
