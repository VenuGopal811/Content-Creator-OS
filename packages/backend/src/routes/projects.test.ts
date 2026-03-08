/**
 * Project Routes Tests
 * Tests for project CRUD endpoints
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Mock the database pool before importing app
jest.mock('../db/pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { app } from '../app';
import { pool } from '../db/pool';

const mockQuery = pool.query as jest.Mock;

// Helper function to generate a valid JWT token
const generateTestToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, config.jwt.secret, { expiresIn: '1h' });
};

const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
const mockUserEmail = 'test@example.com';
const mockProjectId = '987e6543-e21b-12d3-a456-426614174000';

describe('POST /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new project with valid data', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const projectData = {
      name: 'My New Project',
      description: 'A test project',
    };

    // Mock createProject
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: projectData.name,
        description: projectData.description,
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(201);

    expect(response.body).toHaveProperty('project');
    expect(response.body.project.name).toBe(projectData.name);
    expect(response.body.project.description).toBe(projectData.description);
    expect(response.body.project.userId).toBe(mockUserId);
    expect(response.body.project.archived).toBe(false);
  });

  it('should create a project without description', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const projectData = {
      name: 'Project Without Description',
    };

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: projectData.name,
        description: null,
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(201);

    expect(response.body.project.name).toBe(projectData.name);
    expect(response.body.project.description).toBeNull();
  });

  it('should reject creation without authentication', async () => {
    const projectData = {
      name: 'Unauthorized Project',
    };

    const response = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(401);

    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });

  it('should reject creation with invalid token', async () => {
    const projectData = {
      name: 'Invalid Token Project',
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer invalid-token')
      .send(projectData)
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should reject creation with missing name', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const projectData = {
      description: 'Project without name',
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    // Zod returns "Required" for missing required fields
    expect(response.body.error.message).toBeTruthy();
  });

  it('should reject creation with empty name', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const projectData = {
      name: '',
      description: 'Empty name project',
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject creation with name exceeding 255 characters', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const projectData = {
      name: 'a'.repeat(256),
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('255');
  });

  it('should reject creation with description exceeding 1000 characters', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const projectData = {
      name: 'Valid Name',
      description: 'a'.repeat(1001),
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('1000');
  });
});

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list user projects ordered by updatedAt DESC', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    const now = new Date();
    const earlier = new Date(now.getTime() - 3600000);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'project-1',
          user_id: mockUserId,
          name: 'Recent Project',
          description: 'Updated recently',
          archived: false,
          created_at: earlier,
          updated_at: now,
        },
        {
          id: 'project-2',
          user_id: mockUserId,
          name: 'Older Project',
          description: 'Updated earlier',
          archived: false,
          created_at: earlier,
          updated_at: earlier,
        },
      ],
      rowCount: 2,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('projects');
    expect(response.body.projects).toHaveLength(2);
    expect(response.body.projects[0].name).toBe('Recent Project');
    expect(response.body.projects[1].name).toBe('Older Project');
  });

  it('should not include archived projects by default', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'project-1',
          user_id: mockUserId,
          name: 'Active Project',
          description: 'Not archived',
          archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.projects).toHaveLength(1);
    expect(response.body.projects[0].archived).toBe(false);
  });

  it('should include archived projects when requested', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'project-1',
          user_id: mockUserId,
          name: 'Active Project',
          description: 'Not archived',
          archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'project-2',
          user_id: mockUserId,
          name: 'Archived Project',
          description: 'Archived',
          archived: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      rowCount: 2,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .get('/api/projects?includeArchived=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.projects).toHaveLength(2);
  });

  it('should return empty array when user has no projects', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.projects).toEqual([]);
  });

  it('should reject request without authentication', async () => {
    const response = await request(app)
      .get('/api/projects')
      .expect(401);

    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });
});

describe('PUT /api/projects/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update project name and description', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const updateData = {
      name: 'Updated Project Name',
      description: 'Updated description',
    };

    // Mock findById
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: 'Old Name',
        description: 'Old description',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock updateProject
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: updateData.name,
        description: updateData.description,
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .put(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body.project.name).toBe(updateData.name);
    expect(response.body.project.description).toBe(updateData.description);
  });

  it('should update only name', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const updateData = {
      name: 'New Name Only',
    };

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: 'Old Name',
        description: 'Keep this description',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: updateData.name,
        description: 'Keep this description',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .put(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body.project.name).toBe(updateData.name);
  });

  it('should reject update for non-existent project', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const updateData = {
      name: 'Updated Name',
    };

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .put(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(404);

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
  });

  it('should reject update for project owned by different user', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const updateData = {
      name: 'Updated Name',
    };

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: 'different-user-id',
        name: 'Someone Else Project',
        description: 'Not yours',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .put(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should reject update without authentication', async () => {
    const updateData = {
      name: 'Updated Name',
    };

    const response = await request(app)
      .put(`/api/projects/${mockProjectId}`)
      .send(updateData)
      .expect(401);

    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });

  it('should reject update with invalid name', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);
    const updateData = {
      name: '',
    };

    const response = await request(app)
      .put(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/projects/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete project successfully', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    // Mock findById
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: 'Project to Delete',
        description: 'Will be deleted',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock deleteProject
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .delete(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toContain('deleted successfully');
    expect(response.body.deletedProjectId).toBe(mockProjectId);
  });

  it('should reject deletion for non-existent project', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .delete(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
  });

  it('should reject deletion for project owned by different user', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: 'different-user-id',
        name: 'Someone Else Project',
        description: 'Not yours',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .delete(`/api/projects/${mockProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should reject deletion without authentication', async () => {
    const response = await request(app)
      .delete(`/api/projects/${mockProjectId}`)
      .expect(401);

    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });
});

describe('POST /api/projects/:id/archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should archive project successfully', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    // Mock findById
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: 'Project to Archive',
        description: 'Will be archived',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    // Mock archiveProject
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: mockUserId,
        name: 'Project to Archive',
        description: 'Will be archived',
        archived: true,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post(`/api/projects/${mockProjectId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toContain('archived successfully');
    expect(response.body.project.archived).toBe(true);
  });

  it('should reject archival for non-existent project', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post(`/api/projects/${mockProjectId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
  });

  it('should reject archival for project owned by different user', async () => {
    const token = generateTestToken(mockUserId, mockUserEmail);

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: mockProjectId,
        user_id: 'different-user-id',
        name: 'Someone Else Project',
        description: 'Not yours',
        archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      }],
      rowCount: 1,
      command: '',
      oid: 0,
      fields: [],
    });

    const response = await request(app)
      .post(`/api/projects/${mockProjectId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should reject archival without authentication', async () => {
    const response = await request(app)
      .post(`/api/projects/${mockProjectId}/archive`)
      .expect(401);

    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });
});
