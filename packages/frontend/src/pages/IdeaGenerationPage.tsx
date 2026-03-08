/**
 * Idea Generation Page — AI-powered idea brainstorming
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { generateIdeas, selectIdea, setActiveContent } from '../store/contentSlice';
import Layout from '../components/Layout';

export default function IdeaGenerationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { ideas, aiLoading } = useSelector((s: RootState) => s.content);
  const activeProject = useSelector((s: RootState) => s.projects.activeProject);
  const [topic, setTopic] = useState('');

  const handleGenerate = () => {
    if (!topic.trim() || !activeProject) return;
    dispatch(generateIdeas({ projectId: activeProject.id, topic }));
  };

  const handleSelect = async (ideaId: string) => {
    if (!activeProject) return;
    const result = await dispatch(selectIdea({ ideaId, projectId: activeProject.id }));
    if (selectIdea.fulfilled.match(result)) {
      navigate('/editor');
    }
  };

  if (!activeProject) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center glass-card p-12 max-w-md animate-fade-in">
            <span className="text-5xl mb-4 block">📁</span>
            <h2 className="text-xl font-semibold text-white mb-2">No Project Selected</h2>
            <p className="text-surface-400 mb-6">Select or create a project from the dashboard to start generating ideas.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">💡 Idea Lab</h1>
          <p className="text-surface-400">Let AI brainstorm content ideas for <span className="text-brand-400">{activeProject.name}</span></p>
        </div>

        {/* Input */}
        <div className="glass-card p-6 mb-8 animate-slide-up">
          <label className="input-label">Topic or Theme</label>
          <div className="flex gap-3">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="input-field flex-1"
              placeholder="e.g. AI in Indian healthcare, Sustainable technology, Startup fundraising..."
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
            <button onClick={handleGenerate} disabled={aiLoading || !topic.trim()} className="btn-primary whitespace-nowrap">
              {aiLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Thinking...
                </span>
              ) : '✨ Generate Ideas'}
            </button>
          </div>
        </div>

        {/* AI Loading */}
        {aiLoading && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-surface-400 animate-pulse-soft">
              <div className="w-5 h-5 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
              <span className="text-sm">AI is brainstorming creative ideas for you...</span>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-5 ai-shimmer">
                <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
                <div className="h-4 bg-white/5 rounded w-full mb-2" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Ideas Grid */}
        {ideas.length > 0 && !aiLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Generated Ideas</h2>
              <span className="text-sm text-surface-500">{ideas.length} ideas</span>
            </div>
            <div className="space-y-4">
              {ideas.map((idea, i) => (
                <div
                  key={idea.id}
                  className="glass-card-hover p-6 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-2">{idea.title}</h3>
                      <p className="text-sm text-surface-300 mb-3">{idea.description}</p>
                      <div className="flex items-start gap-2">
                        <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-lg mt-0.5">💡 Why this works</span>
                        <p className="text-xs text-surface-400 leading-relaxed">{idea.rationale}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelect(idea.id)}
                      className="btn-primary text-sm shrink-0"
                    >
                      Select & Draft →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {ideas.length === 0 && !aiLoading && (
          <div className="text-center py-16 animate-fade-in">
            <span className="text-6xl mb-4 block">🧠</span>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Brainstorm?</h3>
            <p className="text-surface-400 max-w-md mx-auto">
              Enter a topic above and let AI generate creative, relevant content ideas tailored to your project.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
