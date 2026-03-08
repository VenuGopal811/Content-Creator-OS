/**
 * Feedback Model
 * Defines the Feedback interface and types for the ContentOS platform
 */

export type FeedbackType =
  | 'suggestion_acceptance'
  | 'suggestion_rejection'
  | 'performance_data';

export interface Feedback {
  id: string;
  contentId: string;
  userId: string;
  type: FeedbackType;
  data: Record<string, any>;
  createdAt: Date;
}

export interface CreateFeedbackInput {
  contentId: string;
  userId: string;
  type: FeedbackType;
  data: Record<string, any>;
}

export interface UpdateFeedbackInput {
  type?: FeedbackType;
  data?: Record<string, any>;
}
