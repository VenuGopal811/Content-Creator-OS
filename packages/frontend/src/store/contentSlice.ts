/**
 * Content Redux Slice
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contentService, ideaService, aiService } from '../services/apiService';
import { ContentPiece, Idea, Suggestion, EngagementScore, LifecycleStage } from '../services/mockData';

interface ContentState {
  list: ContentPiece[];
  activeContent: ContentPiece | null;
  ideas: Idea[];
  suggestions: Suggestion[];
  currentScore: EngagementScore | null;
  aiResult: { content: string; explanation: string } | null;
  repurposed: { content: string; changes: { type: string; description: string; rationale: string }[] } | null;
  loading: boolean;
  aiLoading: boolean;
  error: string | null;
}

const initialState: ContentState = {
  list: [],
  activeContent: null,
  ideas: [],
  suggestions: [],
  currentScore: null,
  aiResult: null,
  repurposed: null,
  loading: false,
  aiLoading: false,
  error: null,
};

export const fetchContentByProject = createAsyncThunk(
  'content/fetchByProject',
  async (projectId: string) => contentService.getByProject(projectId)
);

export const fetchContentById = createAsyncThunk(
  'content/fetchById',
  async (id: string) => contentService.getById(id)
);

export const createContent = createAsyncThunk(
  'content/create',
  async (data: { projectId: string; title: string; body: string; tone?: string; stage?: LifecycleStage }) =>
    contentService.create(data)
);

export const updateContent = createAsyncThunk(
  'content/update',
  async ({ id, data }: { id: string; data: Partial<ContentPiece> }) =>
    contentService.update(id, data)
);

export const advanceStage = createAsyncThunk(
  'content/advanceStage',
  async ({ id, stage }: { id: string; stage: LifecycleStage }) =>
    contentService.advanceStage(id, stage)
);

export const generateIdeas = createAsyncThunk(
  'content/generateIdeas',
  async ({ projectId, topic }: { projectId: string; topic: string }) =>
    ideaService.generate(projectId, topic)
);

export const selectIdea = createAsyncThunk(
  'content/selectIdea',
  async ({ ideaId, projectId }: { ideaId: string; projectId: string }) =>
    ideaService.select(ideaId, projectId)
);

export const getAiSuggestion = createAsyncThunk(
  'content/aiSuggestion',
  async ({ action, content }: { action: 'expand' | 'refine' | 'rephrase'; content: string }) =>
    aiService.getSuggestion(action, content)
);

export const repurposeContent = createAsyncThunk(
  'content/repurpose',
  async ({ content, platform }: { content: string; platform: 'twitter' | 'linkedin' | 'blog' }) =>
    aiService.repurpose(content, platform)
);

export const optimizeContent = createAsyncThunk(
  'content/optimize',
  async (content: string) => aiService.optimize(content)
);

export const applySuggestion = createAsyncThunk(
  'content/applySuggestion',
  async ({ contentId, suggestion }: { contentId: string; suggestion: Suggestion }) =>
    aiService.applySuggestion(contentId, suggestion)
);

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setActiveContent(state, action: PayloadAction<ContentPiece | null>) {
      state.activeContent = action.payload;
    },
    clearAiResult(state) {
      state.aiResult = null;
    },
    clearRepurposed(state) {
      state.repurposed = null;
    },
    clearIdeas(state) {
      state.ideas = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Content CRUD
      .addCase(fetchContentByProject.pending, (state) => { state.loading = true; })
      .addCase(fetchContentByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchContentById.fulfilled, (state, action) => {
        if (action.payload) state.activeContent = action.payload;
      })
      .addCase(createContent.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.activeContent = action.payload;
      })
      .addCase(updateContent.fulfilled, (state, action) => {
        if (action.payload) {
          state.activeContent = action.payload;
          const idx = state.list.findIndex(c => c.id === action.payload!.id);
          if (idx >= 0) state.list[idx] = action.payload;
        }
      })
      .addCase(advanceStage.fulfilled, (state, action) => {
        if (action.payload) {
          state.activeContent = action.payload;
          const idx = state.list.findIndex(c => c.id === action.payload!.id);
          if (idx >= 0) state.list[idx] = action.payload;
        }
      })
      // Ideas
      .addCase(generateIdeas.pending, (state) => { state.aiLoading = true; })
      .addCase(generateIdeas.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.ideas = action.payload;
      })
      .addCase(generateIdeas.rejected, (state) => { state.aiLoading = false; })
      .addCase(selectIdea.fulfilled, (state, action) => {
        state.activeContent = action.payload;
        state.list.unshift(action.payload);
      })
      // AI suggestion
      .addCase(getAiSuggestion.pending, (state) => { state.aiLoading = true; })
      .addCase(getAiSuggestion.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.aiResult = action.payload;
      })
      .addCase(getAiSuggestion.rejected, (state) => { state.aiLoading = false; })
      // Repurpose
      .addCase(repurposeContent.pending, (state) => { state.aiLoading = true; })
      .addCase(repurposeContent.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.repurposed = action.payload;
      })
      .addCase(repurposeContent.rejected, (state) => { state.aiLoading = false; })
      // Optimize
      .addCase(optimizeContent.pending, (state) => { state.aiLoading = true; })
      .addCase(optimizeContent.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.currentScore = action.payload.score;
        state.suggestions = action.payload.suggestions;
      })
      .addCase(optimizeContent.rejected, (state) => { state.aiLoading = false; })
      // Apply suggestion
      .addCase(applySuggestion.fulfilled, (state, action) => {
        state.currentScore = action.payload.newScore;
      });
  },
});

export const { setActiveContent, clearAiResult, clearRepurposed, clearIdeas } = contentSlice.actions;
export default contentSlice.reducer;
