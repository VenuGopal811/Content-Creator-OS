/**
 * Idea Model
 * Defines the Idea interface and types for the ContentOS platform
 */

export interface Idea {
  id: string;
  projectId: string;
  title: string;
  description: string;
  rationale: string;
  selected: boolean;
  createdAt: Date;
}

export interface CreateIdeaInput {
  projectId: string;
  title: string;
  description: string;
  rationale: string;
}

export interface UpdateIdeaInput {
  title?: string;
  description?: string;
  rationale?: string;
  selected?: boolean;
}
