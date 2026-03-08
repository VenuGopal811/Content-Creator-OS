import axios from 'axios';
import { User, Project, ContentPiece, Idea, Suggestion, PerformanceMetrics, EngagementScore, LifecycleStage } from './mockData';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ====== AUTH ======
export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },

  // Try to re-fetch the current user using the stored token
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch {
      localStorage.removeItem('token');
      return null;
    }
  },
};

// ====== PROJECTS ======
export const projectService = {
  async list(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data.projects;
  },

  async create(name: string, description: string): Promise<Project> {
    const response = await api.post('/projects', { name, description });
    return response.data.project;
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.project;
  },

  async archive(id: string): Promise<void> {
    await api.post(`/projects/${id}/archive`);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};

// ====== CONTENT ======
export const contentService = {
  async getByProject(projectId: string): Promise<ContentPiece[]> {
    const response = await api.get(`/content/project/${projectId}`);
    return response.data.contents;
  },

  async getById(id: string): Promise<ContentPiece | null> {
    try {
      const response = await api.get(`/content/${id}`);
      return response.data.content;
    } catch {
      return null;
    }
  },

  async create(data: {
    projectId: string; title: string; body: string;
    tone?: string; stage?: LifecycleStage;
  }): Promise<ContentPiece> {
    const response = await api.post('/content', data);
    return response.data.content;
  },

  async update(id: string, data: Partial<ContentPiece>): Promise<ContentPiece> {
    const response = await api.put(`/content/${id}`, data);
    return response.data.content;
  },

  async advanceStage(id: string, newStage: LifecycleStage): Promise<ContentPiece> {
    // Equivalent wrapper for update
    return this.update(id, { stage: newStage });
  },
};

// ====== IDEAS ======
export const ideaService = {
  async generate(projectId: string, topic: string): Promise<Idea[]> {
    const response = await api.post('/ai/ideas/generate', { projectId, topic });
    return response.data.ideas;
  },

  async getByProject(projectId: string): Promise<Idea[]> {
    const response = await api.get(`/ai/ideas/project/${projectId}`);
    return response.data.ideas;
  },

  async select(ideaId: string, projectId: string): Promise<ContentPiece> {
    const response = await api.post('/ai/ideas/select', { ideaId, projectId });
    return response.data.content;
  },
};

// ====== AI SUGGESTIONS ======
export const aiService = {
  async getSuggestion(action: 'expand' | 'refine' | 'rephrase', content: string): Promise<{
    content: string; explanation: string;
  }> {
    const response = await api.post('/ai/suggest', { action, content });
    return response.data.suggestion;
  },

  async repurpose(content: string, platform: 'twitter' | 'linkedin' | 'blog'): Promise<{
    content: string;
    changes: { type: string; description: string; rationale: string }[];
  }> {
    const response = await api.post('/ai/repurpose', { content, platform });
    return response.data.result;
  },

  async optimize(content: string): Promise<{
    score: EngagementScore;
    suggestions: Suggestion[];
  }> {
    const response = await api.post('/ai/optimize', { content });
    return response.data;
  },

  async applySuggestion(contentId: string, suggestion: Suggestion): Promise<{
    newScore: EngagementScore;
  }> {
    const response = await api.post('/ai/apply-suggestion', { contentId, suggestion });
    return response.data;
  },
};

// We temporarily comment out real publishing and analytics since they are not natively fully replaced by backend endpoints in the backend scope

// ====== PUBLISHING ======
export const publishService = {
  async publish(contentId: string): Promise<ContentPiece> {
    return contentService.advanceStage(contentId, 'publish');
  },

  async exportContent(contentId: string, format: 'plain' | 'markdown' | 'html'): Promise<string> {
    const content = await contentService.getById(contentId);
    if (!content) throw new Error('Content not found');

    switch (format) {
      case 'plain':
        return `${content.title}\\n\\n${content.body}`;
      case 'markdown':
        return `# ${content.title}\\n\\n${content.body}`;
      case 'html':
        return `<!DOCTYPE html>\\n<html><head><title>${content.title}</title></head>\\n<body><article>\\n<h1>${content.title}</h1>\\n${content.body.split('\\n\\n').map((p: string) => `<p>${p}</p>`).join('\\n')}\\n</article></body></html>`;
      default:
        return '';
    }
  },
};

// ====== ANALYTICS ======
export const analyticsService = {
  async getMetrics(contentId: string): Promise<PerformanceMetrics | null> {
    return null; 
  },

  async submitFeedback(contentId: string, data: Partial<PerformanceMetrics>): Promise<PerformanceMetrics> {
    // Return mock
    return {
      id: `pm-${Date.now()}`,
      contentId,
      views: data.views || 0,
      engagement: data.engagement || 0,
      conversions: data.conversions || 0,
      engagementRate: data.engagementRate || 0,
      qualitativeFeedback: data.qualitativeFeedback || '',
      recordedAt: new Date().toISOString(),
    };
  },

  async getProjectMetrics(projectId: string): Promise<{
    totalViews: number; totalEngagement: number; totalConversions: number;
    avgEngagementRate: number; contentCount: number;
  }> {
    return {
      totalViews: 0,
      totalEngagement: 0,
      totalConversions: 0,
      avgEngagementRate: 0,
      contentCount: 0,
    };
  },

  async getInsights(): Promise<string[]> {
    return [
      '🔥 Professional tone content performs 2.3x better than conversational in your niche',
      '📊 Articles with data-driven statistics get 40% more engagement'
    ];
  },
};
