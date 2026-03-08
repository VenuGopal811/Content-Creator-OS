/**
 * Repurpose Page — Adapt content for different platforms
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { repurposeContent, clearRepurposed, advanceStage } from '../store/contentSlice';
import { platformFormats } from '../services/mockData';
import Layout from '../components/Layout';
import WorkflowStepper from '../components/WorkflowStepper';

export default function RepurposePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { activeContent, repurposed, aiLoading } = useSelector((s: RootState) => s.content);
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'blog' | null>(null);
  const [copied, setCopied] = useState(false);

  if (!activeContent) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center glass-card p-12 max-w-md animate-fade-in">
            <span className="text-5xl mb-4 block">🔄</span>
            <h2 className="text-xl font-semibold text-white mb-2">No Content to Repurpose</h2>
            <p className="text-surface-400 mb-6">Create or select content in the editor first.</p>
            <button onClick={() => navigate('/editor')} className="btn-primary">Go to Editor</button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleRepurpose = (platform: 'twitter' | 'linkedin' | 'blog') => {
    setSelectedPlatform(platform);
    dispatch(clearRepurposed());
    dispatch(repurposeContent({ content: activeContent.body, platform }));
  };

  const handleCopy = () => {
    if (repurposed) {
      navigator.clipboard.writeText(repurposed.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🔄 Repurpose Content</h1>
              <p className="text-surface-400">Adapt your content for different platforms with AI</p>
            </div>
            <button
              onClick={() => {
                dispatch(advanceStage({ id: activeContent.id, stage: 'publish' }));
                navigate('/publish');
              }}
              className="btn-primary"
            >
              Continue to Publish →
            </button>
          </div>
          <WorkflowStepper currentStage={activeContent.stage} />
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {platformFormats.map(platform => (
            <button
              key={platform.key}
              onClick={() => handleRepurpose(platform.key as any)}
              disabled={aiLoading}
              className={`glass-card-hover p-5 text-left transition-all ${
                selectedPlatform === platform.key ? 'border-brand-500/40 bg-brand-500/5' : ''
              }`}
            >
              <span className="text-3xl mb-3 block">{platform.icon}</span>
              <h3 className="text-base font-semibold text-white mb-1">{platform.name}</h3>
              <p className="text-sm text-surface-400 mb-2">{platform.description}</p>
              <span className="text-xs text-surface-500">Max: {platform.maxLength} {platform.maxLength > 500 ? 'words' : 'chars'}</span>
            </button>
          ))}
        </div>

        {/* Side-by-side comparison */}
        {(aiLoading || repurposed) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            {/* Original */}
            <div>
              <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">Original Content</h3>
              <div className="glass-card p-5">
                <h4 className="text-base font-semibold text-white mb-3">{activeContent.title}</h4>
                <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">{activeContent.body}</p>
              </div>
            </div>

            {/* Repurposed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">
                  {selectedPlatform && platformFormats.find(p => p.key === selectedPlatform)?.name} Version
                </h3>
                {repurposed && (
                  <button onClick={handleCopy} className="btn-ghost text-xs">
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                )}
              </div>

              {aiLoading ? (
                <div className="glass-card p-5 ai-shimmer">
                  <div className="flex items-center gap-2 text-brand-400 text-sm mb-4">
                    <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                    AI is transforming your content...
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-4 bg-white/10 rounded" style={{ width: `${100 - i * 10}%` }} />
                    ))}
                  </div>
                </div>
              ) : repurposed ? (
                <div className="glass-card p-5 border-brand-500/20">
                  <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto mb-4">
                    {repurposed.content}
                  </p>
                  {/* Changes */}
                  <div className="border-t border-white/5 pt-3 mt-3">
                    <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Changes Made</h5>
                    <div className="space-y-2">
                      {repurposed.changes.map((change, i) => (
                        <div key={i} className="flex gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            change.type === 'structure' ? 'bg-blue-500/10 text-blue-400' :
                            change.type === 'length' ? 'bg-amber-500/10 text-amber-400' :
                            change.type === 'style' ? 'bg-accent-500/10 text-accent-400' :
                            'bg-green-500/10 text-green-400'
                          }`}>{change.type}</span>
                          <div>
                            <p className="text-xs text-surface-300">{change.description}</p>
                            <p className="text-xs text-surface-500">{change.rationale}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
