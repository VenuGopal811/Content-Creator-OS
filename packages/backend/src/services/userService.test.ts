/**
 * User Service Tests
 */

import { Pool } from 'pg';
import { UserService } from './userService';
import { CreateUserInput, UpdateUserInput } from '../models/user';
import { comparePassword } from '../utils/password';

// Mock pool for testing
const createMockPool = () => {
  return {
    query: jest.fn(),
  } as any as Pool;
};

describe('UserService', () => {
  let userService: UserService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = createMockPool();
    userService = new UserService(mockPool);
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: input.email,
        password_hash: 'hashed_password',
        name: input.name,
        preferences: {},
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await userService.createUser(input);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        preferences: {},
        createdAt: mockUser.created_at,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([input.email, expect.any(String), input.name, '{}'])
      );
    });

    it('should create a user with preferences', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        preferences: {
          defaultTone: 'professional',
          preferredFormats: ['blog-post'],
        },
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: input.email,
        password_hash: 'hashed_password',
        name: input.name,
        preferences: input.preferences,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await userService.createUser(input);

      expect(result.preferences).toEqual(input.preferences);
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        preferences: {},
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await userService.findById(userId);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        passwordHash: mockUser.password_hash,
        name: mockUser.name,
        preferences: {},
        createdAt: mockUser.created_at,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
    });

    it('should return null if user not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await userService.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: email,
        password_hash: 'hashed_password',
        name: 'Test User',
        preferences: {},
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await userService.findByEmail(email);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        passwordHash: mockUser.password_hash,
        name: mockUser.name,
        preferences: {},
        createdAt: mockUser.created_at,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1'),
        [email]
      );
    });

    it('should return null if user not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await userService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user name', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const input: UpdateUserInput = {
        name: 'Updated Name',
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: input.name,
        preferences: {},
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await userService.updateUser(userId, input);

      expect(result?.name).toBe(input.name);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should update user preferences', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const input: UpdateUserInput = {
        preferences: {
          defaultTone: 'conversational',
        },
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        preferences: input.preferences,
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await userService.updateUser(userId, input);

      expect(result?.preferences).toEqual(input.preferences);
    });

    it('should return null if user not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await userService.updateUser('nonexistent-id', {
        name: 'New Name',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await userService.deleteUser(userId);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users'),
        [userId]
      );
    });

    it('should return false if user not found', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await userService.deleteUser('nonexistent-id');

      expect(result).toBe(false);
    });
  });
});

describe('UserService - Password Reset', () => {
  let userService: UserService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    userService = new UserService(mockPool);
  });

  describe('createPasswordResetToken', () => {
    it('should create reset token for existing user', async () => {
      const email = 'test@example.com';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock findByEmail
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email,
          password_hash: 'hashed_password',
          name: 'Test User',
          preferences: {},
          created_at: new Date(),
        }],
        rowCount: 1,
      });

      // Mock insert token
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const token = await userService.createPasswordResetToken(email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token!.length).toBeGreaterThan(0);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      // Mock findByEmail to return null
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const token = await userService.createPasswordResetToken(email);

      expect(token).toBeNull();
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should store token with expiration time', async () => {
      const email = 'test@example.com';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock findByEmail
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email,
          password_hash: 'hashed_password',
          name: 'Test User',
          preferences: {},
          created_at: new Date(),
        }],
        rowCount: 1,
      });

      // Mock insert token
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await userService.createPasswordResetToken(email);

      // Verify the insert query was called with correct parameters
      const insertCall = mockPool.query.mock.calls[1];
      expect(insertCall[0]).toContain('INSERT INTO password_reset_tokens');
      expect(insertCall[1][0]).toBe(userId);
      expect(insertCall[1][1]).toBeDefined(); // token
      expect(insertCall[1][2]).toBeInstanceOf(Date); // expires_at
    });
  });

  describe('verifyResetToken', () => {
    it('should return user ID for valid token', async () => {
      const token = 'valid-token';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: userId,
          expires_at: new Date(Date.now() + 3600000), // 1 hour from now
          used: false,
        }],
        rowCount: 1,
      });

      const result = await userService.verifyResetToken(token);

      expect(result).toBe(userId);
    });

    it('should return null for non-existent token', async () => {
      const token = 'invalid-token';

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await userService.verifyResetToken(token);

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const token = 'expired-token';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: userId,
          expires_at: new Date(Date.now() - 3600000), // 1 hour ago
          used: false,
        }],
        rowCount: 1,
      });

      const result = await userService.verifyResetToken(token);

      expect(result).toBeNull();
    });

    it('should return null for already used token', async () => {
      const token = 'used-token';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: userId,
          expires_at: new Date(Date.now() + 3600000),
          used: true,
        }],
        rowCount: 1,
      });

      const result = await userService.verifyResetToken(token);

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-token';
      const newPassword = 'newpassword123';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock verifyResetToken
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: userId,
          expires_at: new Date(Date.now() + 3600000),
          used: false,
        }],
        rowCount: 1,
      });

      // Mock update password
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      // Mock mark token as used
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const result = await userService.resetPassword(token, newPassword);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should return false for invalid token', async () => {
      const token = 'invalid-token';
      const newPassword = 'newpassword123';

      // Mock verifyResetToken to return null
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await userService.resetPassword(token, newPassword);

      expect(result).toBe(false);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should hash the new password before storing', async () => {
      const token = 'valid-token';
      const newPassword = 'newpassword123';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock verifyResetToken
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: userId,
          expires_at: new Date(Date.now() + 3600000),
          used: false,
        }],
        rowCount: 1,
      });

      // Mock update password
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      // Mock mark token as used
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await userService.resetPassword(token, newPassword);

      // Verify the update query was called with hashed password
      const updateCall = mockPool.query.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE users');
      expect(updateCall[0]).toContain('password_hash');
      expect(updateCall[1][0]).not.toBe(newPassword); // Should be hashed
      expect(updateCall[1][0]).toBeDefined();
    });

    it('should mark token as used after successful reset', async () => {
      const token = 'valid-token';
      const newPassword = 'newpassword123';
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock verifyResetToken
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: userId,
          expires_at: new Date(Date.now() + 3600000),
          used: false,
        }],
        rowCount: 1,
      });

      // Mock update password
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      // Mock mark token as used
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      await userService.resetPassword(token, newPassword);

      // Verify the token was marked as used
      const markUsedCall = mockPool.query.mock.calls[2];
      expect(markUsedCall[0]).toContain('UPDATE password_reset_tokens');
      expect(markUsedCall[0]).toContain('used = true');
      expect(markUsedCall[1][0]).toBe(token);
    });
  });
});
