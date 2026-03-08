/**
 * Mock Service — simulates backend API calls with realistic delays
 * No PostgreSQL, Redis, or API keys needed
 */

import {
  demoUser, sampleProjects, sampleContent, mockIdeaTopics,
  mockSuggestions, mockRepurposedContent, mockOptimizationSuggestions,
  mockAnalytics,
  User, Project, ContentPiece, Idea, Suggestion, PerformanceMetrics,
  EngagementScore, LifecycleStage,
} from './mockData';

// Simluate network delay
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const randomDelay = () => delay(400 + Math.random() * 800);
const aiDelay = () => delay(1200 + Math.random() * 1500);

// In-memory stores
let users: User[] = [demoUser];
let projects: Project[] = [...sampleProjects];
let contentPieces: ContentPiece[] = [...sampleContent];
let ideas: Idea[] = [];
let analytics: PerformanceMetrics[] = [...mockAnalytics];
let currentUser: User | null = null;

let idCounter = 100;
const newId = (prefix: string) => `${prefix}-${++idCounter}`;

// ====== AUTH ======
export const authService = {
  async login(email: string, _password: string): Promise<{ user: User; token: string }> {
    await randomDelay();
    const user = users.find(u => u.email === email) || demoUser;
    currentUser = user;
    return { user, token: 'demo-jwt-token-' + Date.now() };
  },

  async register(name: string, email: string, _password: string): Promise<{ user: User; token: string }> {
    await randomDelay();
    const user: User = {
      id: newId('u'),
      email,
      name,
      preferences: { defaultTone: 'professional', preferredFormats: ['blog'] },
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    currentUser = user;
    return { user, token: 'demo-jwt-token-' + Date.now() };
  },

  logout() {
    currentUser = null;
  },

  getCurrentUser(): User | null {
    return currentUser;
  },
};

// ====== PROJECTS ======
export const projectService = {
  async list(): Promise<Project[]> {
    await randomDelay();
    return projects.filter(p => !p.archived).sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async create(name: string, description: string): Promise<Project> {
    await randomDelay();
    const project: Project = {
      id: newId('p'),
      userId: currentUser?.id || 'u-001',
      name,
      description,
      archived: false,
      contentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(project);
    return project;
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    await randomDelay();
    const idx = projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...data, updatedAt: new Date().toISOString() };
      return projects[idx];
    }
    throw new Error('Project not found');
  },

  async archive(id: string): Promise<void> {
    await randomDelay();
    const idx = projects.findIndex(p => p.id === id);
    if (idx >= 0) projects[idx].archived = true;
  },

  async remove(id: string): Promise<void> {
    await randomDelay();
    projects = projects.filter(p => p.id !== id);
    contentPieces = contentPieces.filter(c => c.projectId !== id);
  },
};

// ====== CONTENT ======
export const contentService = {
  async getByProject(projectId: string): Promise<ContentPiece[]> {
    await randomDelay();
    return contentPieces.filter(c => c.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getById(id: string): Promise<ContentPiece | null> {
    await delay(200);
    return contentPieces.find(c => c.id === id) || null;
  },

  async create(data: {
    projectId: string; title: string; body: string;
    tone?: string; stage?: LifecycleStage;
  }): Promise<ContentPiece> {
    await randomDelay();
    const wordCount = data.body.trim().split(/\s+/).filter(w => w.length > 0).length;
    const content: ContentPiece = {
      id: newId('c'),
      projectId: data.projectId,
      userId: currentUser?.id || 'u-001',
      title: data.title,
      body: data.body,
      tone: data.tone || null,
      persona: null,
      stage: data.stage || 'draft',
      engagementScore: null,
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      metadata: { wordCount, readingTime: Math.ceil(wordCount / 200), tags: [] },
    };
    contentPieces.push(content);
    // Update project content count
    const proj = projects.find(p => p.id === data.projectId);
    if (proj) proj.contentCount++;
    return content;
  },

  async update(id: string, data: Partial<ContentPiece>): Promise<ContentPiece> {
    await delay(300);
    const idx = contentPieces.findIndex(c => c.id === id);
    if (idx < 0) throw new Error('Content not found');
    const updated = { ...contentPieces[idx], ...data, updatedAt: new Date().toISOString(), version: contentPieces[idx].version + 1 };
    if (data.body) {
      const wc = data.body.trim().split(/\s+/).filter(w => w.length > 0).length;
      updated.metadata = { ...updated.metadata, wordCount: wc, readingTime: Math.ceil(wc / 200) };
    }
    contentPieces[idx] = updated;
    return updated;
  },

  async advanceStage(id: string, newStage: LifecycleStage): Promise<ContentPiece> {
    return this.update(id, {
      stage: newStage,
      ...(newStage === 'publish' ? { publishedAt: new Date().toISOString() } : {}),
    });
  },
};

// ====== IDEAS (AI-powered mock) ======
export const ideaService = {
  async generate(projectId: string, _topic: string): Promise<Idea[]> {
    await aiDelay(); // Simulate AI thinking
    const templateIdeas = mockIdeaTopics.default;
    const generated = templateIdeas.map(idea => ({
      ...idea,
      id: newId('idea'),
      projectId,
      createdAt: new Date().toISOString(),
    }));
    ideas.push(...generated);
    return generated;
  },

  async getByProject(projectId: string): Promise<Idea[]> {
    await delay(200);
    return ideas.filter(i => i.projectId === projectId);
  },

  async select(ideaId: string, projectId: string): Promise<ContentPiece> {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) throw new Error('Idea not found');
    idea.selected = true;
    return contentService.create({
      projectId,
      title: idea.title,
      body: idea.description + '\n\n' + idea.rationale,
      stage: 'draft',
    });
  },
};

// ====== AI SUGGESTIONS ======
export const aiService = {
  async getSuggestion(action: 'expand' | 'refine' | 'rephrase', _content: string): Promise<{
    content: string; explanation: string;
  }> {
    await aiDelay();
    return mockSuggestions[action];
  },

  async repurpose(_content: string, platform: 'twitter' | 'linkedin' | 'blog'): Promise<{
    content: string;
    changes: { type: string; description: string; rationale: string }[];
  }> {
    await aiDelay();
    const result = mockRepurposedContent[platform];
    return { content: result.content, changes: result.changes };
  },

  async optimize(_content: string): Promise<{
    score: EngagementScore;
    suggestions: Suggestion[];
  }> {
    await aiDelay();
    return {
      score: {
        overall: 72,
        breakdown: { clarity: 82, structure: 78, toneConsistency: 75, platformFit: 65, readability: 60 },
        timestamp: new Date().toISOString(),
      },
      suggestions: mockOptimizationSuggestions,
    };
  },

  async applySuggestion(contentId: string, suggestion: Suggestion): Promise<{
    newScore: EngagementScore;
  }> {
    await aiDelay();
    // Simulate score improvement
    const content = contentPieces.find(c => c.id === contentId);
    const currentScore = content?.engagementScore || {
      overall: 72,
      breakdown: { clarity: 82, structure: 78, toneConsistency: 75, platformFit: 65, readability: 60 },
      timestamp: new Date().toISOString(),
    };

    const impactBoost = suggestion.impact === 'high' ? 8 : suggestion.impact === 'medium' ? 5 : 3;
    const cat = suggestion.category as keyof typeof currentScore.breakdown;
    const newBreakdown = { ...currentScore.breakdown };
    if (cat in newBreakdown) {
      (newBreakdown as any)[cat] = Math.min(100, (newBreakdown as any)[cat] + impactBoost);
    }
    const vals = Object.values(newBreakdown);
    const weights = [0.25, 0.2, 0.2, 0.2, 0.15];
    const newOverall = Math.round(vals.reduce((s, v, i) => s + v * weights[i], 0));

    const newScore: EngagementScore = {
      overall: newOverall,
      breakdown: newBreakdown,
      timestamp: new Date().toISOString(),
    };

    if (content) {
      contentService.update(contentId, { engagementScore: newScore } as any);
    }

    return { newScore };
  },
};

// ====== PUBLISHING ======
export const publishService = {
  async publish(contentId: string): Promise<ContentPiece> {
    await randomDelay();
    return contentService.advanceStage(contentId, 'publish');
  },

  async exportContent(contentId: string, format: 'plain' | 'markdown' | 'html'): Promise<string> {
    await delay(300);
    const content = contentPieces.find(c => c.id === contentId);
    if (!content) throw new Error('Content not found');

    switch (format) {
      case 'plain':
        return `${content.title}\n\n${content.body}`;
      case 'markdown':
        return `# ${content.title}\n\n${content.body}`;
      case 'html':
        return `<!DOCTYPE html>
<html><head><title>${content.title}</title></head>
<body><article>
<h1>${content.title}</h1>
${content.body.split('\n\n').map(p => `<p>${p}</p>`).join('\n')}
</article></body></html>`;
    }
  },
};

// ====== ANALYTICS ======
export const analyticsService = {
  async getMetrics(contentId: string): Promise<PerformanceMetrics | null> {
    await randomDelay();
    return analytics.find(a => a.contentId === contentId) || null;
  },

  async submitFeedback(contentId: string, data: Partial<PerformanceMetrics>): Promise<PerformanceMetrics> {
    await randomDelay();
    const metric: PerformanceMetrics = {
      id: newId('pm'),
      contentId,
      views: data.views || 0,
      engagement: data.engagement || 0,
      conversions: data.conversions || 0,
      engagementRate: data.engagementRate || 0,
      qualitativeFeedback: data.qualitativeFeedback || '',
      recordedAt: new Date().toISOString(),
    };
    analytics.push(metric);
    return metric;
  },

  async getProjectMetrics(projectId: string): Promise<{
    totalViews: number; totalEngagement: number; totalConversions: number;
    avgEngagementRate: number; contentCount: number;
  }> {
    await randomDelay();
    const projectContent = contentPieces.filter(c => c.projectId === projectId);
    const projectAnalytics = analytics.filter(a =>
      projectContent.some(c => c.id === a.contentId)
    );

    return {
      totalViews: projectAnalytics.reduce((s, a) => s + a.views, 0),
      totalEngagement: projectAnalytics.reduce((s, a) => s + a.engagement, 0),
      totalConversions: projectAnalytics.reduce((s, a) => s + a.conversions, 0),
      avgEngagementRate: projectAnalytics.length > 0
        ? projectAnalytics.reduce((s, a) => s + a.engagementRate, 0) / projectAnalytics.length
        : 0,
      contentCount: projectContent.length,
    };
  },

  async getInsights(): Promise<string[]> {
    await aiDelay();
    return [
      '🔥 Professional tone content performs 2.3x better than conversational in your niche',
      '📊 Articles with data-driven statistics get 40% more engagement',
      '⏰ Your audience is most active on Tuesday and Thursday mornings',
      '📱 78% of your readers access content on mobile — optimize for shorter paragraphs',
      '🎯 Healthcare and AI topics consistently outperform other categories in your portfolio',
    ];
  },
};
