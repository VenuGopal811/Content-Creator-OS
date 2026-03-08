/**
 * User Model
 * Defines the User interface and types for the ContentOS platform
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  defaultTone?: string;
  defaultPersona?: string;
  preferredFormats?: string[];
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  preferences?: UserPreferences;
}

export interface UpdateUserInput {
  name?: string;
  preferences?: UserPreferences;
}

export type UserWithoutPassword = Omit<User, 'passwordHash'>;
