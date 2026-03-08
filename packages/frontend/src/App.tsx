/**
 * App.tsx — Main application with routing
 */
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { restoreSession } from './store/authSlice';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import IdeaGenerationPage from './pages/IdeaGenerationPage';
import ContentEditorPage from './pages/ContentEditorPage';
import RepurposePage from './pages/RepurposePage';
import OptimizePage from './pages/OptimizePage';
import PublishPage from './pages/PublishPage';
import AnalyticsPage from './pages/AnalyticsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/ideas" element={<ProtectedRoute><IdeaGenerationPage /></ProtectedRoute>} />
      <Route path="/editor" element={<ProtectedRoute><ContentEditorPage /></ProtectedRoute>} />
      <Route path="/repurpose" element={<ProtectedRoute><RepurposePage /></ProtectedRoute>} />
      <Route path="/optimize" element={<ProtectedRoute><OptimizePage /></ProtectedRoute>} />
      <Route path="/publish" element={<ProtectedRoute><PublishPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
