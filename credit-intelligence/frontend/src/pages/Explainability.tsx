import { useEffect, useState } from 'react';
import { Brain, Info, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import type { FeatureImportanceResponse } from '../types';

export default function Explainability() {
  const [data, setData] = useState<FeatureImportanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getFeatureImportance()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><div className="spinner" /></div>;
  if (error) return <div className="page-container"><div className="alert alert-error"><AlertTriangle /> {error}</div></div>;

  const chartData = data?.top_features.slice(0, 15).map(f => ({
    name: f.feature.replace(/_/g, ' ').substring(0, 25),
    importance: Number(f.importance.toFixed(4))
  })) || [];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Global Explainability</h2>
        <p className="page-subtitle">Understand how the ML model makes decisions across all applicants</p>
      </div>

      <div className="alert alert-info">
        <Info size={16} />
        <div>
          <strong>Explanation Method: {data?.method || 'Feature Importance'}</strong><br/>
          {data?.note}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">Top 15 Most Influential Features</div>
          <Brain size={18} color="var(--color-text-muted)" />
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1a2236', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              itemStyle={{ color: '#06b6d4' }}
            />
            <Bar dataKey="importance" fill="url(#colorImp)" radius={[0, 4, 4, 0]} />
            <defs>
              <linearGradient id="colorImp" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Engineered Features</div>
          <div className="card-subtitle">Derived variables created to improve model performance</div>
        </div>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {data?.engineered_features && Object.entries(data.engineered_features).map(([key, val]) => (
            <div key={key} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '8px' }}>{key}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                <strong>Formula:</strong> <code>{val.formula}</code>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <strong>Interpretation:</strong> {val.interpretation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
