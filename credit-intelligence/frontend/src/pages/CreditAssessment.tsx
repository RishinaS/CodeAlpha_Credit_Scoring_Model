import { useEffect, useState } from 'react';
import {
  User, DollarSign, CreditCard, Clock, Briefcase,
  AlertTriangle, CheckCircle, TrendingUp, Info, ChevronRight, RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import type { CreditApplicationInput, PredictionResponse, ValidOptionsResponse } from '../types';

// Demo profiles for quick testing
const DEMO_PROFILES = {
  low_risk: {
    label: '✅ Stable Low-Risk Applicant',
    data: {
      duration: 12, credit_amount: 3000, installment_commitment: 2,
      residence_since: 4, age: 42, existing_credits: 1, num_dependents: 1,
      checking_status: '>=200', credit_history: 'all paid', purpose: 'furniture/equipment',
      savings_status: '>=1000', employment: '>=7', personal_status: 'male single',
      other_parties: 'none', property_magnitude: 'real estate', other_payment_plans: 'none',
      housing: 'own', job: 'skilled', own_telephone: 'yes', foreign_worker: 'yes',
    }
  },
  medium_risk: {
    label: '⚠️ Moderate-Risk Applicant',
    data: {
      duration: 36, credit_amount: 8000, installment_commitment: 3,
      residence_since: 2, age: 28, existing_credits: 2, num_dependents: 1,
      checking_status: '0<=X<200', credit_history: 'existing paid', purpose: 'new car',
      savings_status: '100<=X<500', employment: '1<=X<4', personal_status: 'male single',
      other_parties: 'none', property_magnitude: 'car', other_payment_plans: 'bank',
      housing: 'rent', job: 'skilled', own_telephone: 'none', foreign_worker: 'yes',
    }
  },
  high_risk: {
    label: '🔴 High-Risk Applicant',
    data: {
      duration: 60, credit_amount: 15000, installment_commitment: 4,
      residence_since: 1, age: 23, existing_credits: 3, num_dependents: 2,
      checking_status: '<0', credit_history: 'critical/other existing credit', purpose: 'used car',
      savings_status: 'no known savings', employment: 'unemployed', personal_status: 'female div/dep/mar',
      other_parties: 'none', property_magnitude: 'no known property', other_payment_plans: 'stores',
      housing: 'free', job: 'unskilled resident', own_telephone: 'none', foreign_worker: 'yes',
    }
  }
};

const defaultForm: CreditApplicationInput = {
  duration: 24,
  credit_amount: 5000,
  installment_commitment: 2,
  residence_since: 3,
  age: 35,
  existing_credits: 1,
  num_dependents: 1,
  checking_status: '0<=X<200',
  credit_history: 'existing paid',
  purpose: 'furniture/equipment',
  savings_status: '100<=X<500',
  employment: '1<=X<4',
  personal_status: 'male single',
  other_parties: 'none',
  property_magnitude: 'real estate',
  other_payment_plans: 'none',
  housing: 'own',
  job: 'skilled',
  own_telephone: 'yes',
  foreign_worker: 'yes',
};

function RiskGauge({ score, level }: { score: number; level: string }) {
  const color = level === 'Low Risk' ? '#10b981' : level === 'Medium Risk' ? '#f59e0b' : '#ef4444';
  const angle = -90 + (score / 100) * 180;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 200 110" width="200" height="110">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="251"
          strokeDashoffset={251 - (score / 100) * 251}
        />
        {/* Needle */}
        <g transform={`rotate(${angle}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill={color} />
        </g>
        {/* Score text */}
        <text x="100" y="86" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color} fontFamily="Space Grotesk">
          {score}
        </text>
        <text x="100" y="98" textAnchor="middle" fontSize="9" fill="#64748b">RISK SCORE</text>
        {/* Labels */}
        <text x="16" y="112" fontSize="8" fill="#10b981">LOW</text>
        <text x="88" y="112" fontSize="8" fill="#f59e0b">MED</text>
        <text x="162" y="112" fontSize="8" fill="#ef4444">HIGH</text>
      </svg>
    </div>
  );
}

function PredictionResult({ result }: { result: PredictionResponse }) {
  const riskColor = result.risk_level === 'Low Risk' ? 'var(--color-low-risk)' :
                    result.risk_level === 'Medium Risk' ? 'var(--color-medium-risk)' : 'var(--color-high-risk)';

  const badgeClass = result.risk_level === 'Low Risk' ? 'risk-badge-low' :
                     result.risk_level === 'Medium Risk' ? 'risk-badge-medium' : 'risk-badge-high';

  const incFactors = result.explanation?.increasing_risk_factors || [];
  const decFactors = result.explanation?.decreasing_risk_factors || [];

  const maxShap = Math.max(
    ...incFactors.map(f => Math.abs(f.shap_value || f.importance || 0)),
    ...decFactors.map(f => Math.abs(f.shap_value || f.importance || 0)),
    0.001
  );

  return (
    <div className="fade-in" style={{ marginTop: '32px' }}>
      <div className="card" style={{ marginBottom: '20px', borderColor: riskColor + '40' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assessment Result
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`risk-badge ${badgeClass}`} style={{ fontSize: '1rem', padding: '6px 16px' }}>
                {result.risk_level}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <div>ID: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.prediction_id}</strong></div>
            <div style={{ marginTop: '2px' }}>{new Date(result.timestamp).toLocaleString()}</div>
            <div style={{ marginTop: '2px' }}>Model: {result.model_version}</div>
          </div>
        </div>

        {/* Gauge + Probabilities */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <RiskGauge score={result.risk_score} level={result.risk_level} />
            <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center' }}>
              Project-specific risk score (NOT an official credit bureau score)
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                Prediction Probabilities
              </div>

              {/* Low Risk probability */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Low Risk</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-low-risk)' }}>
                    {(result.probability_low_risk * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${result.probability_low_risk * 100}%`,
                    background: 'var(--color-low-risk)'
                  }} />
                </div>
              </div>

              {/* High Risk probability */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>High Risk</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-high-risk)' }}>
                    {(result.probability_high_risk * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${result.probability_high_risk * 100}%`,
                    background: 'var(--color-high-risk)'
                  }} />
                </div>
              </div>

              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
                fontSize: '0.8rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Algorithm</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{result.algorithm?.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="var(--color-primary-light)" />
            Why was this applicant classified as {result.risk_level}?
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Based on {result.explanation?.method || 'feature importance'} from the trained model
          </div>

          {result.explanation?.note && (
            <div className="alert alert-info" style={{ marginBottom: '16px' }}>
              <Info size={14} />
              <span>{result.explanation.note}</span>
            </div>
          )}

          {incFactors.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-high-risk-light)', marginBottom: '8px' }}>
                🔴 Factors Increasing Risk
              </div>
              {incFactors.map((factor, i) => {
                const val = Math.abs(factor.shap_value || factor.importance || 0);
                const pct = maxShap > 0 ? (val / maxShap) * 100 : 0;
                return (
                  <div key={i} className="factor-row">
                    <span className="factor-name">{factor.feature.replace(/_/g, ' ').replace(/\s+/g, ' ')}</span>
                    <div className="factor-bar">
                      <div className="factor-fill-positive" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="factor-value" style={{ color: 'var(--color-high-risk-light)' }}>
                      +{val.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {decFactors.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-low-risk-light)', marginBottom: '8px' }}>
                🟢 Factors Decreasing Risk
              </div>
              {decFactors.map((factor, i) => {
                const val = Math.abs(factor.shap_value || factor.importance || 0);
                const pct = maxShap > 0 ? (val / maxShap) * 100 : 0;
                return (
                  <div key={i} className="factor-row">
                    <span className="factor-name">{factor.feature.replace(/_/g, ' ')}</span>
                    <div className="factor-bar">
                      <div className="factor-fill-negative" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="factor-value" style={{ color: 'var(--color-low-risk-light)' }}>
                      -{val.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {incFactors.length === 0 && decFactors.length === 0 && result.explanation?.top_factors && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Top Influential Features
              </div>
              {(result.explanation.top_factors as any[]).slice(0, 6).map((f: any, i: number) => {
                const feat = Array.isArray(f) ? f[0] : f.feature;
                const imp = Array.isArray(f) ? Math.abs(f[1]) : Math.abs(f.importance || 0);
                return (
                  <div key={i} className="factor-row">
                    <span className="factor-name">{feat?.replace(/_/g, ' ')}</span>
                    <div className="factor-bar">
                      <div className="factor-fill-positive" style={{ width: `${imp * 100}%` }} />
                    </div>
                    <span className="factor-value" style={{ color: 'var(--color-primary-light)' }}>
                      {imp.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="disclaimer-banner">
        ⚠️ {result.disclaimer}
      </div>
    </div>
  );
}

export default function CreditAssessment() {
  const [form, setForm] = useState<CreditApplicationInput>(defaultForm);
  const [options, setOptions] = useState<ValidOptionsResponse | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getValidOptions().then(setOptions).catch(() => {});
  }, []);

  const handleChange = (field: keyof CreditApplicationInput, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.predict(form);
      setResult(res);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = (profile: keyof typeof DEMO_PROFILES) => {
    setForm(DEMO_PROFILES[profile].data as CreditApplicationInput);
    setResult(null);
    setError(null);
  };

  const sel = (field: keyof ValidOptionsResponse) =>
    options ? options[field] : [];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Credit Risk Assessment</h2>
        <p className="page-subtitle">
          Enter applicant financial information to generate an AI-powered credit risk estimate
        </p>
      </div>

      {/* Demo profiles */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          📋 Quick Demo Profiles (For demonstration purposes only — synthetic data)
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(DEMO_PROFILES).map(([key, profile]) => (
            <button
              key={key}
              className="btn btn-outline btn-sm"
              onClick={() => loadDemo(key as keyof typeof DEMO_PROFILES)}
            >
              {profile.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '24px' }}>
          {/* Section 1: Basic Info */}
          <div className="form-section">
            <div className="form-section-title">
              <User size={16} /> Personal Information
            </div>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Age (years)</label>
                <input
                  type="number" className="form-input" min="18" max="100"
                  value={form.age}
                  onChange={e => handleChange('age', parseInt(e.target.value))}
                  required
                />
                <div className="form-hint">18–100 years</div>
              </div>
              <div className="form-group">
                <label className="form-label">Personal Status</label>
                <select className="form-select" value={form.personal_status}
                  onChange={e => handleChange('personal_status', e.target.value)}>
                  {sel('personal_status').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Number of Dependents</label>
                <select className="form-select" value={form.num_dependents}
                  onChange={e => handleChange('num_dependents', parseInt(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Employment */}
          <div className="form-section">
            <div className="form-section-title">
              <Briefcase size={16} /> Income & Employment
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Employment Duration</label>
                <select className="form-select" value={form.employment}
                  onChange={e => handleChange('employment', e.target.value)}>
                  {sel('employment').map(v => <option key={v} value={v}>{v} years</option>)}
                </select>
                <div className="form-hint">Years at current employer</div>
              </div>
              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select className="form-select" value={form.job}
                  onChange={e => handleChange('job', e.target.value)}>
                  {sel('job').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Residence Duration</label>
                <select className="form-select" value={form.residence_since}
                  onChange={e => handleChange('residence_since', parseInt(e.target.value))}>
                  {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v} year{v > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Housing</label>
                <select className="form-select" value={form.housing}
                  onChange={e => handleChange('housing', e.target.value)}>
                  {sel('housing').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Credit & Loan */}
          <div className="form-section">
            <div className="form-section-title">
              <DollarSign size={16} /> Loan Information
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Credit Amount (currency units)</label>
                <input
                  type="number" className="form-input" min="100" max="200000"
                  value={form.credit_amount}
                  onChange={e => handleChange('credit_amount', parseFloat(e.target.value))}
                  required
                />
                <div className="form-hint">100–200,000 units</div>
              </div>
              <div className="form-group">
                <label className="form-label">Loan Duration (months)</label>
                <input
                  type="number" className="form-input" min="1" max="120"
                  value={form.duration}
                  onChange={e => handleChange('duration', parseInt(e.target.value))}
                  required
                />
                <div className="form-hint">1–120 months</div>
              </div>
              <div className="form-group">
                <label className="form-label">Installment Rate (% of income)</label>
                <select className="form-select" value={form.installment_commitment}
                  onChange={e => handleChange('installment_commitment', parseInt(e.target.value))}>
                  {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}% of disposable income</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Loan Purpose</label>
                <select className="form-select" value={form.purpose}
                  onChange={e => handleChange('purpose', e.target.value)}>
                  {sel('purpose').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Credit History */}
          <div className="form-section">
            <div className="form-section-title">
              <CreditCard size={16} /> Credit History
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Checking Account Status</label>
                <select className="form-select" value={form.checking_status}
                  onChange={e => handleChange('checking_status', e.target.value)}>
                  {sel('checking_status').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="form-hint">Balance in DM (currency units)</div>
              </div>
              <div className="form-group">
                <label className="form-label">Credit History</label>
                <select className="form-select" value={form.credit_history}
                  onChange={e => handleChange('credit_history', e.target.value)}>
                  {sel('credit_history').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Savings Account Status</label>
                <select className="form-select" value={form.savings_status}
                  onChange={e => handleChange('savings_status', e.target.value)}>
                  {sel('savings_status').map(v => <option key={v} value={v}>{v} DM</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Number of Existing Credits</label>
                <select className="form-select" value={form.existing_credits}
                  onChange={e => handleChange('existing_credits', parseInt(e.target.value))}>
                  {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Additional */}
          <div className="form-section">
            <div className="form-section-title">
              <Clock size={16} /> Additional Details
            </div>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Other Debtors / Guarantors</label>
                <select className="form-select" value={form.other_parties}
                  onChange={e => handleChange('other_parties', e.target.value)}>
                  {sel('other_parties').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Property / Assets</label>
                <select className="form-select" value={form.property_magnitude}
                  onChange={e => handleChange('property_magnitude', e.target.value)}>
                  {sel('property_magnitude').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Other Installment Plans</label>
                <select className="form-select" value={form.other_payment_plans}
                  onChange={e => handleChange('other_payment_plans', e.target.value)}>
                  {sel('other_payment_plans').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Own Telephone</label>
                <select className="form-select" value={form.own_telephone}
                  onChange={e => handleChange('own_telephone', e.target.value)}>
                  {sel('own_telephone').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Foreign Worker</label>
                <select className="form-select" value={form.foreign_worker}
                  onChange={e => handleChange('foreign_worker', e.target.value)}>
                  {sel('foreign_worker').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="alert alert-info" style={{ marginTop: '8px' }}>
            <Info size={16} />
            <div>
              <strong>Privacy Notice:</strong> This form does not collect Aadhaar, PAN, bank account numbers,
              card numbers, passwords, or real financial credentials. Data submitted is used only for
              risk estimation demonstration.
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '12px' }}>
              <AlertTriangle size={16} />
              <span><strong>Error:</strong> {error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp size={18} />
                  Assess Credit Risk
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setForm(defaultForm); setResult(null); setError(null); }}
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        </div>
      </form>

      {result && <PredictionResult result={result} />}
    </div>
  );
}
