/**
 * Project Redux Slice
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectService } from '../services/apiService';
import { Project } from '../services/mockData';

interface ProjectState {
  list: Project[];
  activeProject: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  list: [],
  activeProject: null,
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk('projects/fetchAll', async () => {
  return await projectService.list();
});

export const createProject = createAsyncThunk(
  'projects/create',
  async ({ name, description }: { name: string; description: string }) => {
    return await projectService.create(name, description);
  }
);

export const deleteProject = createAsyncThunk('projects/delete', async (id: string) => {
  await projectService.remove(id);
  return id;
});

export const archiveProject = createAsyncThunk('projects/archive', async (id: string) => {
  await projectService.archive(id);
  return id;
});

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setActiveProject(state, action) {
      state.activeProject = action.payload;
    },
    clearActiveProject(state) {
      state.activeProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load projects';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
        if (state.activeProject?.id === action.payload) state.activeProject = null;
      })
      .addCase(archiveProject.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
        if (state.activeProject?.id === action.payload) state.activeProject = null;
      });
  },
});

export const { setActiveProject, clearActiveProject } = projectSlice.actions;
export default projectSlice.reducer;
