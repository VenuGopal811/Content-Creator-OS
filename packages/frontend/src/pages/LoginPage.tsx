/**
 * Login Page — Beautiful gradient login with demo credentials
 */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) navigate('/dashboard');
  };

  const handleDemoLogin = async () => {
    const result = await dispatch(login({ email: 'creator@contentos.ai', password: 'demo' }));
    if (login.fulfilled.match(result)) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-surface-950 via-brand-950 to-surface-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl mb-8">
            CO
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Your AI<br />
            <span className="gradient-text">Content Co-pilot</span>
          </h1>
          <p className="text-lg text-surface-400 mb-8 leading-relaxed">
            Generate ideas, write drafts, optimize for engagement, repurpose across platforms — all powered by AI that understands your voice.
          </p>
          <div className="space-y-3">
            {['💡 AI-Powered Idea Generation', '✍️ Smart Content Studio', '📊 Engagement Optimization', '🔄 Multi-Platform Repurposing', '📈 Performance Analytics'].map(f => (
              <div key={f} className="flex items-center gap-3 text-surface-300">
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface-950">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold mb-4">
              CO
            </div>
            <h1 className="text-3xl font-bold text-white">ContentOS</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-surface-400 mb-8">Sign in to your content workspace</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-surface-500 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button onClick={handleDemoLogin} disabled={loading} className="btn-accent w-full mb-6">
            ✨ Try Demo (No Sign-up Required)
          </button>

          <p className="text-center text-surface-500 text-sm">
            Don't have an account? <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
