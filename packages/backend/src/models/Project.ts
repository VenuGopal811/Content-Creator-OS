/**
 * Project Model
 * Defines the Project interface and types for the ContentOS platform
 */

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  archived?: boolean;
}
