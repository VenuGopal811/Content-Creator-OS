/**
 * Layout — App shell with dark sidebar navigation and top bar
 */
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/authSlice';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/ideas', label: 'Idea Lab', icon: '💡' },
  { path: '/editor', label: 'Content Studio', icon: '✍️' },
  { path: '/repurpose', label: 'Repurpose', icon: '🔄' },
  { path: '/optimize', label: 'Optimize', icon: '📊' },
  { path: '/publish', label: 'Publish', icon: '🚀' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const activeProject = useSelector((s: RootState) => s.projects.activeProject);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-surface-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
              CO
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-white text-base">ContentOS</h1>
                <p className="text-[10px] text-surface-500 font-medium tracking-wider uppercase">AI Co-pilot</p>
              </div>
            )}
          </Link>
        </div>

        {/* Active Project */}
        {!sidebarCollapsed && activeProject && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-1">Active Project</p>
            <p className="text-sm font-medium text-white truncate">{activeProject.name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive ? 'nav-item-active' : 'nav-item'}
                title={item.label}
              >
                <span className="text-lg">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle + user */}
        <div className="px-3 py-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="nav-item w-full justify-center"
          >
            <span className="text-lg">{sidebarCollapsed ? '→' : '←'}</span>
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-white font-semibold text-xs">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <button onClick={handleLogout} className="text-xs text-surface-500 hover:text-red-400 transition-colors">
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
