/**
 * Content Model
 * Defines the Content interface and types for the ContentOS platform
 */

export type LifecycleStage =
  | 'idea'
  | 'draft'
  | 'refine'
  | 'optimize'
  | 'repurpose'
  | 'publish'
  | 'analyze';

export interface ContentMetadata {
  wordCount: number;
  readingTime: number;
  tags: string[];
  category?: string;
}

export interface ScoreBreakdown {
  clarity: number; // 0-100
  structure: number; // 0-100
  toneConsistency: number; // 0-100
  platformFit: number; // 0-100
  readability: number; // 0-100
}

export interface EngagementScore {
  overall: number; // 0-100
  breakdown: ScoreBreakdown;
  timestamp: Date;
}

export interface Content {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  body: string;
  tone: string | null;
  persona: string | null;
  stage: LifecycleStage;
  sourceContentId?: string | null;
  targetFormat?: string | null;
  engagementScore?: EngagementScore | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata: ContentMetadata;
}

export interface CreateContentInput {
  projectId: string;
  userId: string;
  title: string;
  body: string;
  tone?: string;
  persona?: string;
  stage?: LifecycleStage;
  sourceContentId?: string;
  targetFormat?: string;
  metadata?: Partial<ContentMetadata>;
}

export interface UpdateContentInput {
  title?: string;
  body?: string;
  tone?: string;
  persona?: string;
  stage?: LifecycleStage;
  targetFormat?: string;
  engagementScore?: EngagementScore;
  publishedAt?: Date;
  metadata?: Partial<ContentMetadata>;
}
