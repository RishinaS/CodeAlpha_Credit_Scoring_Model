import { useEffect, useState } from 'react';
import { History, AlertTriangle, ArrowRight, Activity, Search } from 'lucide-react';
import { api } from '../services/api';
import type { PredictionHistoryResponse } from '../types';

export default function PredictionHistory() {
  const [history, setHistory] = useState<PredictionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadData = async (skip: number) => {
    setLoading(true);
    try {
      const res = await api.getPredictions({ skip, limit });
      setHistory(res);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page * limit);
  }, [page]);

  if (loading && !history) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Prediction History</h2>
        <p className="page-subtitle">View past credit risk assessments and their scores</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} />
          <span>Failed to load history: {error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Assessments</div>
            <div className="card-subtitle">Showing {(page * limit) + 1} to Math.min((page + 1) * limit, history?.total || 0) of {history?.total || 0}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 0 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={!history || ((page + 1) * limit) >= history.total || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {history && history.predictions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Applicant Profile</th>
                  <th>Risk Level</th>
                  <th>Score</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {history.predictions.map((p) => {
                  const badgeClass = p.risk_level === 'Low Risk' ? 'risk-badge-low' :
                                    p.risk_level === 'Medium Risk' ? 'risk-badge-medium' : 'risk-badge-high';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace' }}>{p.prediction_id}</td>
                      <td>{new Date(p.timestamp).toLocaleString()}</td>
                      <td>
                        {p.age}y, {p.credit_amount} units, {p.duration}m
                      </td>
                      <td>
                        <span className={`risk-badge ${badgeClass}`}>{p.risk_level}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.risk_score}/100</td>
                      <td>
                        <span className="chip" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>
                          {p.model_version}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <History size={36} />
            <h3>No predictions found</h3>
            <p>Assessments you perform will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
