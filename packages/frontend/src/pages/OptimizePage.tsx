/**
 * Optimize Page — Engagement scoring and optimization suggestions
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { optimizeContent, applySuggestion, advanceStage } from '../store/contentSlice';
import { Suggestion } from '../services/mockData';
import Layout from '../components/Layout';
import WorkflowStepper from '../components/WorkflowStepper';

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-surface-300">{label}</span>
        <span className="text-sm font-semibold text-white">{score}</span>
      </div>
      <div className="score-bar">
        <div
          className={`score-bar-fill ${color}`}
          style={{ width: `${score}%`, ['--score-width' as any]: `${score}%` }}
        />
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-gradient-to-r from-green-500 to-green-400';
  if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-amber-400';
  return 'bg-gradient-to-r from-red-500 to-red-400';
}

export default function OptimizePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { activeContent, currentScore, suggestions, aiLoading } = useSelector((s: RootState) => s.content);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeContent && !currentScore) {
      dispatch(optimizeContent(activeContent.body));
    }
  }, [activeContent, currentScore, dispatch]);

  if (!activeContent) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center glass-card p-12 max-w-md animate-fade-in">
            <span className="text-5xl mb-4 block">📊</span>
            <h2 className="text-xl font-semibold text-white mb-2">No Content to Optimize</h2>
            <p className="text-surface-400 mb-6">Create content in the editor first.</p>
            <button onClick={() => navigate('/editor')} className="btn-primary">Go to Editor</button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleApply = async (suggestion: Suggestion) => {
    setApplyingId(suggestion.id);
    await dispatch(applySuggestion({ contentId: activeContent.id, suggestion }));
    setAppliedIds(prev => new Set(prev).add(suggestion.id));
    setApplyingId(null);
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📊 Optimization Dashboard</h1>
              <p className="text-surface-400">Analyze and improve your content's engagement potential</p>
            </div>
            <button
              onClick={() => {
                dispatch(advanceStage({ id: activeContent.id, stage: 'repurpose' }));
                navigate('/repurpose');
              }}
              className="btn-primary"
            >
              Continue to Repurpose →
            </button>
          </div>
          <WorkflowStepper currentStage={activeContent.stage} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Overview */}
          <div className="lg:col-span-1 space-y-4">
            {/* Overall Score */}
            <div className="glass-card p-6 text-center animate-slide-up">
              {aiLoading && !currentScore ? (
                <div className="py-8">
                  <div className="w-8 h-8 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-surface-400">Analyzing content...</p>
                </div>
              ) : currentScore ? (
                <>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">Overall Score</p>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${currentScore.overall * 2.64} 264`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#d946ef" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreColor(currentScore.overall)}`}>
                        {currentScore.overall}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-surface-400">
                    {currentScore.overall >= 80 ? 'Excellent! Ready to publish.' :
                     currentScore.overall >= 60 ? 'Good, but can be improved.' :
                     'Needs significant improvement.'}
                  </p>
                </>
              ) : null}
            </div>

            {/* Score Breakdown */}
            {currentScore && (
              <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h3 className="text-sm font-semibold text-white mb-4">Score Breakdown</h3>
                <ScoreBar label="Clarity (25%)" score={currentScore.breakdown.clarity} color={getBarColor(currentScore.breakdown.clarity)} />
                <ScoreBar label="Structure (20%)" score={currentScore.breakdown.structure} color={getBarColor(currentScore.breakdown.structure)} />
                <ScoreBar label="Tone (20%)" score={currentScore.breakdown.toneConsistency} color={getBarColor(currentScore.breakdown.toneConsistency)} />
                <ScoreBar label="Platform Fit (20%)" score={currentScore.breakdown.platformFit} color={getBarColor(currentScore.breakdown.platformFit)} />
                <ScoreBar label="Readability (15%)" score={currentScore.breakdown.readability} color={getBarColor(currentScore.breakdown.readability)} />
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Optimization Suggestions</h3>
            {aiLoading && suggestions.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass-card p-5 ai-shimmer">
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-full mb-1" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((sug, i) => {
                  const isApplied = appliedIds.has(sug.id);
                  const isApplying = applyingId === sug.id;
                  return (
                    <div
                      key={sug.id}
                      className={`glass-card p-5 animate-slide-up ${isApplied ? 'border-green-500/20 bg-green-500/5' : ''}`}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              sug.impact === 'high' ? 'bg-red-500/10 text-red-400' :
                              sug.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>{sug.impact} impact</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-white/5 text-surface-400`}>{sug.category}</span>
                          </div>
                          <p className="text-sm font-medium text-white mb-1">{sug.description}</p>
                          <p className="text-sm text-surface-300 mb-2">{sug.recommendation}</p>
                          <p className="text-xs text-surface-500">{sug.explanation}</p>
                        </div>
                        <button
                          onClick={() => handleApply(sug)}
                          disabled={isApplied || isApplying}
                          className={`shrink-0 text-sm ${isApplied ? 'text-green-400 cursor-default' : 'btn-primary'}`}
                        >
                          {isApplying ? (
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Applying
                            </span>
                          ) : isApplied ? '✓ Applied' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Re-analyze */}
            {suggestions.length > 0 && (
              <button
                onClick={() => dispatch(optimizeContent(activeContent.body))}
                disabled={aiLoading}
                className="btn-secondary mt-4"
              >
                🔄 Re-analyze Content
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
