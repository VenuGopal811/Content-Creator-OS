/**
 * Publish Page — Export and publish content
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { advanceStage } from '../store/contentSlice';
import { publishService } from '../services/apiService';
import Layout from '../components/Layout';
import WorkflowStepper from '../components/WorkflowStepper';

export default function PublishPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { activeContent } = useSelector((s: RootState) => s.content);
  const [exportFormat, setExportFormat] = useState<'plain' | 'markdown' | 'html'>('markdown');
  const [exported, setExported] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!activeContent) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center glass-card p-12 max-w-md animate-fade-in">
            <span className="text-5xl mb-4 block">🚀</span>
            <h2 className="text-xl font-semibold text-white mb-2">No Content to Publish</h2>
            <p className="text-surface-400 mb-6">Create content in the editor first.</p>
            <button onClick={() => navigate('/editor')} className="btn-primary">Go to Editor</button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleExport = async () => {
    setExporting(true);
    const result = await publishService.exportContent(activeContent.id, exportFormat);
    setExported(result);
    setExporting(false);
  };

  const handlePublish = async () => {
    await dispatch(advanceStage({ id: activeContent.id, stage: 'publish' }));
    setPublished(true);
  };

  const handleCopy = () => {
    if (exported) {
      navigator.clipboard.writeText(exported);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!exported) return;
    const ext = exportFormat === 'html' ? 'html' : exportFormat === 'markdown' ? 'md' : 'txt';
    const mime = exportFormat === 'html' ? 'text/html' : 'text/plain';
    const blob = new Blob([exported], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeContent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🚀 Publish & Export</h1>
              <p className="text-surface-400">Finalize your content for the world</p>
            </div>
            {published && (
              <button
                onClick={() => {
                  dispatch(advanceStage({ id: activeContent.id, stage: 'analyze' }));
                  navigate('/analytics');
                }}
                className="btn-primary"
              >
                View Analytics →
              </button>
            )}
          </div>
          <WorkflowStepper currentStage={published ? 'publish' : activeContent.stage} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="animate-slide-up">
            <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">Content Preview</h3>
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className={`stage-badge ${
                  published ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {published ? '✓ Published' : activeContent.stage}
                </span>
                {activeContent.tone && (
                  <span className="stage-badge bg-brand-500/10 text-brand-400 border border-brand-500/20">{activeContent.tone}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-4">{activeContent.title}</h2>
              <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">{activeContent.body}</p>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-xs text-surface-500">
                <span>📝 {activeContent.metadata.wordCount} words</span>
                <span>⏱️ {activeContent.metadata.readingTime} min read</span>
                <span>v{activeContent.version}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {/* Publish */}
            {!published ? (
              <div className="glass-card p-6 bg-gradient-to-br from-brand-900/20 to-accent-900/10">
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Publish?</h3>
                <p className="text-sm text-surface-400 mb-4">Mark this content as published. It will move to the 'Published' stage in your workflow.</p>
                <button onClick={handlePublish} className="btn-primary w-full text-lg py-3">
                  🚀 Publish Now
                </button>
              </div>
            ) : (
              <div className="glass-card p-6 border-green-500/20 bg-green-500/5 animate-bounce-in">
                <div className="text-center">
                  <span className="text-4xl mb-3 block">🎉</span>
                  <h3 className="text-lg font-semibold text-white mb-2">Published Successfully!</h3>
                  <p className="text-sm text-surface-400">
                    Published at {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Export */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-4">Export Content</h3>
              <div className="flex gap-2 mb-4">
                {(['plain', 'markdown', 'html'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => { setExportFormat(fmt); setExported(null); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      exportFormat === fmt
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        : 'bg-white/5 text-surface-400 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {fmt === 'plain' ? '📄 Plain' : fmt === 'markdown' ? '📝 Markdown' : '🌐 HTML'}
                  </button>
                ))}
              </div>

              <button onClick={handleExport} disabled={exporting} className="btn-secondary w-full mb-3">
                {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
              </button>

              {exported && (
                <div className="animate-slide-up">
                  <div className="bg-surface-900 rounded-xl p-4 mb-3 max-h-48 overflow-auto">
                    <pre className="text-xs text-surface-300 whitespace-pre-wrap font-mono">{exported}</pre>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="btn-ghost flex-1 text-sm">
                      {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                    <button onClick={handleDownload} className="btn-ghost flex-1 text-sm">
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
