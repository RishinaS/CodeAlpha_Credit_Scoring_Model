import { useEffect, useState } from 'react';
import { Shield, Info, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import type { FairnessResponse } from '../types';

export default function ResponsibleAI() {
  const [data, setData] = useState<FairnessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getFairness()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><div className="spinner" /></div>;
  if (error) return <div className="page-container"><div className="alert alert-error"><AlertTriangle /> {error}</div></div>;

  const chartData = data?.groups.map(g => ({
    name: g.group,
    Accuracy: Number((g.accuracy * 100).toFixed(1)),
    'Predicted High Risk %': Number((g.predicted_high_risk_rate * 100).toFixed(1))
  })) || [];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Responsible AI & Fairness</h2>
        <p className="page-subtitle">Ethical analysis of model behavior across groups</p>
      </div>

      <div className="alert alert-warning">
        <Shield size={20} />
        <div>
          <strong>Disclaimer:</strong> {data?.disclaimer}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Disparity Analysis: {data?.dataset}</div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Bar dataKey="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Predicted High Risk %" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '16px' }}>
            {data?.protected_attributes_note}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Ethical Considerations</div>
          </div>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data?.ethical_considerations.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Data Quality & Limitations</div>
        </div>
        <div className="grid-2">
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Data Quality</h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              {data?.data_quality_notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Limitations</h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              {data?.limitations.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
