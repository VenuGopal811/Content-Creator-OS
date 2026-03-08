/**
 * Authentication Routes Tests
 * Tests for user registration, login, and password reset endpoints
 */

import request from 'supertest';

// Mock the database pool before importing app
jest.mock('../db/pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { app } from '../app';
import { pool } from '../db/pool';

const mockQuery = pool.query as jest.Mock;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user with valid data', async () => {
    const newUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    // Mock findByEmail to return null (user doesn't exist)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock createUser to return the created user
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: newUser.email,
        password_hash: 'hashed_password',
        name: newUser.name,
        preferences: {},
        created_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(newUser.email);
    expect(response.body.user.name).toBe(newUser.name);
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('should reject registration with invalid email', async () => {
    const invalidUser = {
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(invalidUser)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('email');
  });

  it('should reject registration with short password', async () => {
    const invalidUser = {
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(invalidUser)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('8 characters');
  });

  it('should reject registration with missing name', async () => {
    const invalidUser = {
      email: 'test@example.com',
      password: 'password123',
      name: '',
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(invalidUser)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('Name');
  });

  it('should reject registration if user already exists', async () => {
    const existingUser = {
      email: 'existing@example.com',
      password: 'password123',
      name: 'Existing User',
    };

    // Mock findByEmail to return an existing user
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: existingUser.email,
        password_hash: 'hashed_password',
        name: existingUser.name,
        preferences: {},
        created_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(existingUser)
      .expect(409);

    expect(response.body.error.code).toBe('USER_EXISTS');
    expect(response.body.error.message).toContain('already exists');
  });

  it('should accept optional preferences', async () => {
    const newUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      preferences: {
        defaultTone: 'professional',
        preferredFormats: ['blog-post', 'twitter-thread'],
      },
    };

    // Mock findByEmail to return null
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock createUser
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: newUser.email,
        password_hash: 'hashed_password',
        name: newUser.name,
        preferences: newUser.preferences,
        created_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser)
      .expect(201);

    expect(response.body.user.preferences).toEqual(newUser.preferences);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login with valid credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    // Mock findByEmail to return a user
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456', // Mock bcrypt hash
        name: 'Test User',
        preferences: {},
        created_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock bcrypt.compare to return true
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(loginData.email);
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('should reject login with invalid email', async () => {
    const loginData = {
      email: 'invalid-email',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('email');
  });

  it('should reject login with missing password', async () => {
    const loginData = {
      email: 'test@example.com',
      password: '',
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('Password');
  });

  it('should reject login with non-existent email', async () => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    // Mock findByEmail to return null (user doesn't exist)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('should reject login with incorrect password', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    // Mock findByEmail to return a user
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        name: 'Test User',
        preferences: {},
        created_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock bcrypt.compare to return false
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('should return JWT token on successful login', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    // Mock findByEmail
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        name: 'Test User',
        preferences: {},
        created_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock bcrypt.compare
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/reset-request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate reset token for existing user', async () => {
    const resetRequest = {
      email: 'test@example.com',
    };

    // Mock findByEmail to return a user
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: resetRequest.email,
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        name: 'Test User',
        preferences: {},
        created_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock insert reset token
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/reset-request')
      .send(resetRequest)
      .expect(200);

    expect(response.body.message).toContain('password reset link');
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
  });

  it('should return success message even for non-existent email', async () => {
    const resetRequest = {
      email: 'nonexistent@example.com',
    };

    // Mock findByEmail to return null
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/reset-request')
      .send(resetRequest)
      .expect(200);

    expect(response.body.message).toContain('password reset link');
    expect(response.body.token).toBeUndefined();
  });

  it('should reject request with invalid email format', async () => {
    const resetRequest = {
      email: 'invalid-email',
    };

    const response = await request(app)
      .post('/api/auth/reset-request')
      .send(resetRequest)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('email');
  });

  it('should reject request with missing email', async () => {
    const response = await request(app)
      .post('/api/auth/reset-request')
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reset password with valid token', async () => {
    const resetData = {
      token: 'valid-reset-token-123',
      newPassword: 'newpassword123',
    };

    // Mock verifyResetToken - check token validity
    mockQuery.mockResolvedValueOnce({
      rows: [{
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        expires_at: new Date(Date.now() + 3600000), // 1 hour from now
        used: false,
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock update user password
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock mark token as used
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send(resetData)
      .expect(200);

    expect(response.body.message).toContain('successfully reset');
  });

  it('should reject reset with invalid token', async () => {
    const resetData = {
      token: 'invalid-token',
      newPassword: 'newpassword123',
    };

    // Mock verifyResetToken - token not found
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send(resetData)
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_TOKEN');
    expect(response.body.error.message).toContain('invalid or has expired');
  });

  it('should reject reset with expired token', async () => {
    const resetData = {
      token: 'expired-token',
      newPassword: 'newpassword123',
    };

    // Mock verifyResetToken - token expired
    mockQuery.mockResolvedValueOnce({
      rows: [{
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        expires_at: new Date(Date.now() - 3600000), // 1 hour ago
        used: false,
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send(resetData)
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should reject reset with already used token', async () => {
    const resetData = {
      token: 'used-token',
      newPassword: 'newpassword123',
    };

    // Mock verifyResetToken - token already used
    mockQuery.mockResolvedValueOnce({
      rows: [{
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        expires_at: new Date(Date.now() + 3600000),
        used: true,
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send(resetData)
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should reject reset with short password', async () => {
    const resetData = {
      token: 'valid-token',
      newPassword: 'short',
    };

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send(resetData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('8 characters');
  });

  it('should reject reset with missing token', async () => {
    const resetData = {
      newPassword: 'newpassword123',
    };

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send(resetData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject reset with missing password', async () => {
    const resetData = {
      token: 'valid-token',
    };

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send(resetData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
