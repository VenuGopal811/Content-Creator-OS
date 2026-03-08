/**
 * Dashboard Page — Project overview with stats and management
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProjects, createProject, deleteProject, setActiveProject } from '../store/projectSlice';
import { fetchContentByProject } from '../store/contentSlice';
import Layout from '../components/Layout';

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { list: projects, loading } = useSelector((s: RootState) => s.projects);
  const user = useSelector((s: RootState) => s.auth.user);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await dispatch(createProject({ name: newName, description: newDesc }));
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
  };

  const selectProject = (project: typeof projects[0]) => {
    dispatch(setActiveProject(project));
    dispatch(fetchContentByProject(project.id));
    navigate('/ideas');
  };

  const totalContent = projects.reduce((s, p) => s + p.contentCount, 0);

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Creator'} 👋
          </h1>
          <p className="text-surface-400">Here's your content workspace overview</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Projects', value: projects.length, icon: '📁', color: 'from-brand-600/20 to-brand-500/5' },
            { label: 'Content Pieces', value: totalContent, icon: '📝', color: 'from-accent-600/20 to-accent-500/5' },
            { label: 'Published', value: 2, icon: '🚀', color: 'from-green-600/20 to-green-500/5' },
            { label: 'Avg Score', value: '72/100', icon: '📊', color: 'from-amber-600/20 to-amber-500/5' },
          ].map((stat, i) => (
            <div key={stat.label} className={`glass-card p-5 bg-gradient-to-br ${stat.color} animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-surface-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Projects header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Your Projects</h2>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            + New Project
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowCreate(false)}>
            <div className="glass-card p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Project Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} className="input-field" placeholder="e.g. AI for Education Blog" autoFocus />
                </div>
                <div>
                  <label className="input-label">Description</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="input-field" rows={3} placeholder="Brief description of your content project..." />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
                  <button onClick={handleCreate} className="btn-primary">Create Project</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
                <div className="h-4 bg-white/5 rounded w-full mb-2" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="glass-card-hover p-5 cursor-pointer animate-slide-up group"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => selectProject(project)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors pr-2">{project.name}</h3>
                  <button
                    onClick={e => { e.stopPropagation(); dispatch(deleteProject(project.id)); }}
                    className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-red-400 transition-all text-sm"
                    title="Delete"
                  >✕</button>
                </div>
                <p className="text-sm text-surface-400 mb-4 line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-surface-500">
                  <span>📝 {project.contentCount} pieces</span>
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Start Guide */}
        <div className="mt-8 glass-card p-6 bg-gradient-to-r from-brand-900/20 to-accent-900/10 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-3">🚀 Quick Start Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Select a Project', desc: 'Click a project to start working' },
              { step: '2', title: 'Generate Ideas', desc: 'AI brainstorms content ideas for you' },
              { step: '3', title: 'Create & Optimize', desc: 'Write with AI suggestions & scoring' },
              { step: '4', title: 'Publish & Analyze', desc: 'Export and track performance' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-surface-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
