/**
 * Analytics Page — Performance metrics and insights
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { analyticsService } from '../services/mockService';
import { PerformanceMetrics } from '../services/mockData';
import Layout from '../components/Layout';
import WorkflowStepper from '../components/WorkflowStepper';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { activeContent } = useSelector((s: RootState) => s.content);
  const activeProject = useSelector((s: RootState) => s.projects.activeProject);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [projectMetrics, setProjectMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [ins] = await Promise.all([
        analyticsService.getInsights(),
      ]);
      setInsights(ins);

      if (activeContent) {
        const m = await analyticsService.getMetrics(activeContent.id);
        setMetrics(m);
      }
      if (activeProject) {
        const pm = await analyticsService.getProjectMetrics(activeProject.id);
        setProjectMetrics(pm);
      }
      setLoading(false);
    }
    loadData();
  }, [activeContent, activeProject]);

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">📈 Analytics Dashboard</h1>
          <p className="text-surface-400">
            Track performance and discover patterns
            {activeProject && <span> for <span className="text-brand-400">{activeProject.name}</span></span>}
          </p>
          {activeContent && (
            <div className="mt-4">
              <WorkflowStepper currentStage="analyze" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
                <div className="h-8 bg-white/5 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Project-level stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Views', value: projectMetrics?.totalViews || metrics?.views || 2847, icon: '👁️', change: '+23%' },
                { label: 'Engagement', value: projectMetrics?.totalEngagement || metrics?.engagement || 423, icon: '❤️', change: '+18%' },
                { label: 'Conversions', value: projectMetrics?.totalConversions || metrics?.conversions || 67, icon: '🎯', change: '+12%' },
                { label: 'Engagement Rate', value: `${(projectMetrics?.avgEngagementRate || metrics?.engagementRate || 14.85).toFixed(1)}%`, icon: '📊', change: '+5%' },
              ].map((stat, i) => (
                <div key={stat.label} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{stat.change}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                  <p className="text-sm text-surface-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart (simplified bar chart) */}
              <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <h3 className="text-base font-semibold text-white mb-4">Weekly Performance</h3>
                <div className="flex items-end gap-2 h-40">
                  {[
                    { day: 'Mon', views: 320, engagement: 48 },
                    { day: 'Tue', views: 580, engagement: 85 },
                    { day: 'Wed', views: 420, engagement: 62 },
                    { day: 'Thu', views: 650, engagement: 95 },
                    { day: 'Fri', views: 380, engagement: 55 },
                    { day: 'Sat', views: 280, engagement: 38 },
                    { day: 'Sun', views: 220, engagement: 30 },
                  ].map((d, i) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col gap-0.5">
                        <div
                          className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md transition-all duration-500"
                          style={{ height: `${(d.views / 650) * 100}%`, minHeight: '8px', animationDelay: `${i * 100}ms` }}
                          title={`${d.views} views`}
                        />
                        <div
                          className="w-full bg-gradient-to-t from-accent-600 to-accent-400 rounded-t-md transition-all duration-500"
                          style={{ height: `${(d.engagement / 95) * 40}%`, minHeight: '4px' }}
                          title={`${d.engagement} engagement`}
                        />
                      </div>
                      <span className="text-xs text-surface-500">{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-surface-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-brand-500" />
                    <span>Views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-accent-500" />
                    <span>Engagement</span>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <h3 className="text-base font-semibold text-white mb-4">🧠 AI Insights</h3>
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors animate-slide-up"
                      style={{ animationDelay: `${400 + i * 100}ms` }}
                    >
                      <p className="text-sm text-surface-200">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Performance Table */}
              {metrics && (
                <div className="lg:col-span-2 glass-card p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <h3 className="text-base font-semibold text-white mb-4">Content Performance Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-surface-500 text-left">
                          <th className="pb-3 font-medium">Content</th>
                          <th className="pb-3 font-medium">Views</th>
                          <th className="pb-3 font-medium">Engagement</th>
                          <th className="pb-3 font-medium">Conversions</th>
                          <th className="pb-3 font-medium">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-white/5">
                          <td className="py-3 text-white font-medium">{activeContent?.title || 'Content'}</td>
                          <td className="py-3 text-surface-300">{metrics.views.toLocaleString()}</td>
                          <td className="py-3 text-surface-300">{metrics.engagement.toLocaleString()}</td>
                          <td className="py-3 text-surface-300">{metrics.conversions}</td>
                          <td className="py-3">
                            <span className="text-green-400 font-medium">{metrics.engagementRate}%</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {metrics.qualitativeFeedback && (
                    <div className="mt-4 p-3 rounded-xl bg-white/5">
                      <p className="text-xs text-surface-500 mb-1">User Feedback</p>
                      <p className="text-sm text-surface-300 italic">"{metrics.qualitativeFeedback}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
