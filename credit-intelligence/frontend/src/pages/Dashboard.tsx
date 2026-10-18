import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  TrendingUp, Users, AlertTriangle, CheckCircle,
  Activity, Brain, ArrowRight, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsResponse, FeatureImportanceResponse, TrendResponse } from '../types';

const COLORS = {
  'Low Risk': '#10b981',
  'Medium Risk': '#f59e0b',
  'High Risk': '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a2236', border: '1px solid rgba(99,130,255,0.2)',
        borderRadius: '8px', padding: '12px 16px', fontSize: '0.82rem',
      }}>
        <p style={{ color: '#94a3b8', marginBottom: '6px' }}>{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportanceResponse | null>(null);
  const [trends, setTrends] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, featData, trendData] = await Promise.all([
        api.getAnalytics(),
        api.getFeatureImportance().catch(() => null),
        api.getPredictionTrends(14).catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setFeatureImportance(featData);
      setTrends(trendData);
      setLastRefreshed(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const pieData = analytics ? [
    { name: 'Low Risk', value: analytics.low_risk_count },
    { name: 'Medium Risk', value: analytics.medium_risk_count },
    { name: 'High Risk', value: analytics.high_risk_count },
  ].filter(d => d.value > 0) : [];

  const featData = featureImportance?.top_features.slice(0, 8).map(f => ({
    name: f.feature.replace(/_/g, ' ').substring(0, 20),
    importance: Number(f.importance.toFixed(4)),
  })) || [];

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">Risk Intelligence Dashboard</h2>
          <p className="page-subtitle">
            Real-time credit risk analytics · Model v{analytics?.model_version || '—'} ·
            Algorithm: {analytics?.algorithm?.replace(/_/g, ' ') || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/assessment')}>
            New Assessment <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={16} />
          <span>Failed to load data: {error}. Make sure the backend is running.</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <Users size={20} color="var(--color-primary-light)" />
          </div>
          <div className="stat-value">{analytics?.total_predictions ?? '—'}</div>
          <div className="stat-label">Total Predictions</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle size={20} color="var(--color-low-risk)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-low-risk)' }}>
            {analytics ? `${analytics.low_risk_percentage}%` : '—'}
          </div>
          <div className="stat-label">Low Risk Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <TrendingUp size={20} color="var(--color-medium-risk)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-medium-risk)' }}>
            {analytics ? `${analytics.medium_risk_percentage}%` : '—'}
          </div>
          <div className="stat-label">Medium Risk Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertTriangle size={20} color="var(--color-high-risk)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-high-risk)' }}>
            {analytics ? `${analytics.high_risk_percentage}%` : '—'}
          </div>
          <div className="stat-label">High Risk Rate</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Risk Distribution Pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Risk Distribution</div>
              <div className="card-subtitle">Breakdown of all predictions by risk level</div>
            </div>
            <Activity size={18} color="var(--color-text-muted)" />
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <Brain size={36} />
              <h3>No predictions yet</h3>
              <p>Make your first credit assessment to see risk distribution</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/assessment')} style={{ marginTop: '12px' }}>
                Start Assessment
              </button>
            </div>
          )}
        </div>

        {/* Feature Importance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Predictive Features</div>
              <div className="card-subtitle">
                {featureImportance?.method || 'Feature'} importance from trained model
              </div>
            </div>
            <Brain size={18} color="var(--color-text-muted)" />
          </div>
          {featData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={featData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="importance" fill="url(#importanceGrad)" radius={[0, 4, 4, 0]} />
                <defs>
                  <linearGradient id="importanceGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <BarChart size={36} />
              <h3>Feature data unavailable</h3>
              <p>Train the model to see feature importance</p>
            </div>
          )}
        </div>
      </div>

      {/* Prediction Trends */}
      {trends && trends.data.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Prediction Trends (Last 14 Days)</div>
              <div className="card-subtitle">Daily prediction volume by risk category</div>
            </div>
            <TrendingUp size={18} color="var(--color-text-muted)" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="low_risk" stroke="#10b981" strokeWidth={2} name="Low Risk" dot={false} />
              <Line type="monotone" dataKey="medium_risk" stroke="#f59e0b" strokeWidth={2} name="Medium Risk" dot={false} />
              <Line type="monotone" dataKey="high_risk" stroke="#ef4444" strokeWidth={2} name="High Risk" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid-3">
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/assessment')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', marginBottom: 0 }}>
              <CheckCircle size={20} color="var(--color-primary-light)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>New Assessment</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Evaluate a credit application</div>
            </div>
            <ArrowRight size={16} color="var(--color-text-muted)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/model-analytics')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', marginBottom: 0 }}>
              <BarChart3 size={20} color="var(--color-accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Model Analytics</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Compare ML algorithm performance</div>
            </div>
            <ArrowRight size={16} color="var(--color-text-muted)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/responsible-ai')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', marginBottom: 0 }}>
              <Shield size={20} color="var(--color-low-risk)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Responsible AI</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fairness & ethics analysis</div>
            </div>
            <ArrowRight size={16} color="var(--color-text-muted)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      </div>

      <div className="disclaimer-banner" style={{ marginTop: '24px' }}>
        ⚠️ <strong>Disclaimer:</strong> Credit Intelligence is an experimental AI-based risk estimation tool for educational and analytical purposes.
        It is NOT a substitute for professional financial assessment or official credit-bureau scoring (CIBIL/FICO/etc).
        Last refreshed: {lastRefreshed.toLocaleTimeString()}
      </div>
    </div>
  );
}

// Fix missing import
import { BarChart3, Shield } from 'lucide-react';
