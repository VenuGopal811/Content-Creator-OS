/**
 * Content Editor Page — Write and refine content with AI assistance
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { updateContent, getAiSuggestion, advanceStage, setActiveContent, clearAiResult } from '../store/contentSlice';
import { contentService } from '../services/apiService';
import { toneProfiles } from '../services/mockData';
import Layout from '../components/Layout';
import WorkflowStepper from '../components/WorkflowStepper';

export default function ContentEditorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { activeContent, aiResult, aiLoading } = useSelector((s: RootState) => s.content);
  const activeProject = useSelector((s: RootState) => s.projects.activeProject);
  const contentList = useSelector((s: RootState) => s.content.list);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tone, setTone] = useState('professional');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load active content or pick first from list
  useEffect(() => {
    if (activeContent) {
      setTitle(activeContent.title);
      setBody(activeContent.body);
      setTone(activeContent.tone || 'professional');
    } else if (contentList.length > 0) {
      dispatch(setActiveContent(contentList[0]));
    }
  }, [activeContent, contentList, dispatch]);

  // Auto-save (debounced)
  const autoSave = useCallback(async () => {
    if (!activeContent || !title.trim()) return;
    setSaving(true);
    await dispatch(updateContent({
      id: activeContent.id,
      data: { title, body, tone } as any,
    }));
    setLastSaved(new Date());
    setSaving(false);
  }, [activeContent, title, body, tone, dispatch]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [title, body, tone]);

  const handleAiAction = (action: 'expand' | 'refine' | 'rephrase') => {
    dispatch(getAiSuggestion({ action, content: body }));
  };

  const applyAiResult = () => {
    if (aiResult) {
      setBody(aiResult.content);
      dispatch(clearAiResult());
    }
  };

  const handleAdvanceStage = async () => {
    if (!activeContent) return;
    const stages = ['idea', 'draft', 'refine', 'optimize', 'repurpose', 'publish', 'analyze'] as const;
    const currentIdx = stages.indexOf(activeContent.stage);
    if (currentIdx < stages.length - 1) {
      await dispatch(advanceStage({ id: activeContent.id, stage: stages[currentIdx + 1] }));
      const nextPage: Record<string, string> = { optimize: '/optimize', repurpose: '/repurpose', publish: '/publish' };
      const next = nextPage[stages[currentIdx + 1]];
      if (next) navigate(next);
    }
  };

  if (!activeContent && contentList.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center glass-card p-12 max-w-md animate-fade-in">
            <span className="text-5xl mb-4 block">✍️</span>
            <h2 className="text-xl font-semibold text-white mb-2">No Content Yet</h2>
            <p className="text-surface-400 mb-6">Generate an idea from the Idea Lab to start writing, or create content from scratch.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/ideas')} className="btn-primary">Go to Idea Lab</button>
              <button
                onClick={async () => {
                  if (!activeProject) { navigate('/dashboard'); return; }
                  const c = await contentService.create({
                    projectId: activeProject.id,
                    title: 'Untitled Content',
                    body: 'Start writing your content here...',
                    stage: 'draft',
                  });
                  dispatch(setActiveContent(c));
                }}
                className="btn-secondary"
              >
                + New Draft
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const wordCount = body.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <Layout>
      <div className="flex h-full">
        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-surface-900/30">
            <div className="flex items-center gap-4">
              {activeContent && <WorkflowStepper currentStage={activeContent.stage} compact />}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-surface-500">
                {saving ? '💾 Saving...' : lastSaved ? `✓ Saved ${lastSaved.toLocaleTimeString()}` : ''}
              </span>
              <button onClick={handleAdvanceStage} className="btn-primary text-sm">
                Next Stage →
              </button>
            </div>
          </div>

          {/* Title + Body */}
          <div className="flex-1 overflow-auto p-6">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-surface-600 outline-none mb-4 border-none"
              placeholder="Enter your title..."
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full bg-transparent text-surface-200 placeholder-surface-600 outline-none resize-none leading-relaxed text-[15px] min-h-[60vh]"
              placeholder="Start writing your content..."
            />
          </div>

          {/* Bottom bar */}
          <div className="px-6 py-2 border-t border-white/5 flex items-center justify-between text-xs text-surface-500 bg-surface-900/30">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>{readingTime} min read</span>
              <span>v{activeContent?.version || 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Tone:</span>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
              >
                {toneProfiles.map(t => (
                  <option key={t.key} value={t.key}>{t.icon} {t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="w-80 border-l border-white/5 bg-surface-900/30 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">🤖 AI Assistant</h3>
            <p className="text-xs text-surface-500">Get intelligent suggestions</p>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {/* Action buttons */}
            <div className="space-y-2">
              {[
                { key: 'expand' as const, icon: '📝', label: 'Expand', desc: 'Add more depth and detail' },
                { key: 'refine' as const, icon: '✨', label: 'Refine', desc: 'Tighten and improve clarity' },
                { key: 'rephrase' as const, icon: '🔄', label: 'Rephrase', desc: 'Rewrite with fresh angle' },
              ].map(action => (
                <button
                  key={action.key}
                  onClick={() => handleAiAction(action.key)}
                  disabled={aiLoading || !body.trim()}
                  className="w-full text-left glass-card-hover p-3 flex items-center gap-3"
                >
                  <span className="text-lg">{action.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs text-surface-500">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* AI Loading */}
            {aiLoading && (
              <div className="glass-card p-4 animate-pulse-soft">
                <div className="flex items-center gap-2 text-brand-400 text-sm mb-3">
                  <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                  AI is thinking...
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-4/5" />
                  <div className="h-3 bg-white/5 rounded w-3/5" />
                </div>
              </div>
            )}

            {/* AI Result */}
            {aiResult && !aiLoading && (
              <div className="glass-card p-4 border-brand-500/20 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">AI Suggestion</span>
                  <button onClick={() => dispatch(clearAiResult())} className="text-surface-500 hover:text-white text-xs">✕</button>
                </div>
                <p className="text-sm text-surface-200 mb-3 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                  {aiResult.content}
                </p>
                <div className="bg-brand-500/5 rounded-lg p-2 mb-3">
                  <p className="text-xs text-brand-300"><strong>Why:</strong> {aiResult.explanation}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={applyAiResult} className="btn-primary text-xs flex-1">Apply ✓</button>
                  <button onClick={() => dispatch(clearAiResult())} className="btn-ghost text-xs">Dismiss</button>
                </div>
              </div>
            )}

            {/* Content list */}
            {contentList.length > 1 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Other Content</h4>
                {contentList.filter(c => c.id !== activeContent?.id).map(c => (
                  <button
                    key={c.id}
                    onClick={() => dispatch(setActiveContent(c))}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors mb-1"
                  >
                    <p className="text-sm text-white truncate">{c.title}</p>
                    <p className="text-xs text-surface-500">{c.stage} • {c.metadata.wordCount} words</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
