import { Activity, Clock } from 'lucide-react';

export default function ModelMonitoring() {
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Model Monitoring</h2>
        <p className="page-subtitle">Track model health and data drift over time</p>
      </div>

      <div className="empty-state" style={{ marginTop: '40px', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
        <Activity size={48} color="var(--color-text-muted)" style={{ marginBottom: '20px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)', marginBottom: '12px' }}>Monitoring Dashboard Not Configured</h3>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem', lineHeight: '1.6' }}>
          This section is a placeholder for a production-grade model monitoring system (e.g., Evidently AI, Prometheus/Grafana) to detect data drift, concept drift, and performance degradation.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', color: 'var(--color-primary-light)', fontSize: '0.85rem' }}>
          <Clock size={16} /> Feature planned for future release
        </div>
      </div>
    </div>
  );
}
