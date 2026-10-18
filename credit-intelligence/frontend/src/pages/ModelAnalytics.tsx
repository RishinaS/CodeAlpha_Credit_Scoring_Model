import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { BarChart3, AlertTriangle, CheckCircle, Activity, Star } from 'lucide-react';
import { api } from '../services/api';
import type { ModelMetricsResponse, ModelMetrics } from '../types';

export default function ModelAnalytics() {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getModelMetrics()
      .then(setMetrics)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', minHeight: '50vh' }}><div className="spinner" /></div>;

  if (error) return (
    <div className="page-container">
      <div className="alert alert-error"><AlertTriangle size={16} /> Failed to load metrics: {error}</div>
    </div>
  );

  const models = metrics?.models || [];
  const bestModel = metrics?.best_model;

  // Format data for Recharts Radar
  const radarData = models.map(m => ({
    name: m.name,
    Accuracy: Math.round(m.accuracy * 100),
    Precision: Math.round(m.precision * 100),
    Recall: Math.round(m.recall * 100),
    F1: Math.round(m.f1_score * 100),
    'ROC-AUC': Math.round(m.roc_auc * 100),
  }));

  const comparisonData = [
    { metric: 'Accuracy', ...models.reduce((acc, m) => ({ ...acc, [m.name]: Math.round(m.accuracy * 100) }), {}) },
    { metric: 'ROC-AUC', ...models.reduce((acc, m) => ({ ...acc, [m.name]: Math.round(m.roc_auc * 100) }), {}) },
    { metric: 'F1 Score', ...models.reduce((acc, m) => ({ ...acc, [m.name]: Math.round(m.f1_score * 100) }), {}) },
    { metric: 'Recall', ...models.reduce((acc, m) => ({ ...acc, [m.name]: Math.round(m.recall * 100) }), {}) },
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Model Analytics</h2>
        <p className="page-subtitle">Compare performance metrics across trained ML algorithms</p>
      </div>

      <div className="alert alert-info">
        <Star size={16} />
        <div>
          <strong>Selection Rationale:</strong> {metrics?.selection_rationale}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Performance Comparison</div>
            <BarChart3 size={18} color="var(--color-text-muted)" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1a2236', border: '1px solid rgba(99,130,255,0.2)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '0.8rem' }}
                formatter={(val) => `${val}%`}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {models.map((m, i) => {
                const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'];
                return <Bar key={m.key} dataKey={m.name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />;
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Algorithm Details</div>
            <Activity size={18} color="var(--color-text-muted)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {models.map(m => (
              <div key={m.key} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: m.is_best ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: m.is_best ? 'var(--color-primary-light)' : 'var(--color-text-primary)' }}>
                    {m.name}
                  </div>
                  {m.is_best && <span className="model-badge model-badge-best"><CheckCircle size={12} /> Active Model</span>}
                </div>
                <div className="grid-3" style={{ gap: '12px' }}>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>ROC-AUC</div><div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{(m.roc_auc * 100).toFixed(1)}%</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>F1 Score</div><div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{(m.f1_score * 100).toFixed(1)}%</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Recall</div><div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{(m.recall * 100).toFixed(1)}%</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
