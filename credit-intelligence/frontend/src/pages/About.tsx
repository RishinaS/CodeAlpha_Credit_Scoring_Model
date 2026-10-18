import { BookOpen, Github, Database, Server, Layout, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2 className="page-title">Documentation & About</h2>
        <p className="page-subtitle">Learn more about the Credit Intelligence platform architecture and methodology</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">Project Overview</div>
        </div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '16px' }}>
            <strong>Credit Intelligence</strong> is a demonstration platform for AI-powered credit risk assessment.
            It showcases how machine learning can be integrated into a modern web application to provide
            not just predictions, but explainable and responsible AI insights.
          </p>
          <p>
            The project uses the publicly available <strong>German Credit Dataset</strong> to train multiple classification models,
            selecting the best performer based on a weighted composite score of ROC-AUC, F1, and Recall metrics.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Frontend Architecture</div>
            <Layout size={18} color="var(--color-primary-light)" />
          </div>
          <ul style={{ listStyleType: 'none', color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Framework:</strong> React 18 + TypeScript + Vite</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Styling:</strong> Custom Vanilla CSS variables for a premium dark theme</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Charts:</strong> Recharts for responsive SVG data visualization</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Routing:</strong> React Router v6</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Icons:</strong> Lucide React</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Backend Architecture</div>
            <Server size={18} color="var(--color-accent)" />
          </div>
          <ul style={{ listStyleType: 'none', color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Framework:</strong> FastAPI (Python)</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Machine Learning:</strong> Scikit-learn (RandomForest, Logistic Regression, Decision Tree, Gradient Boosting)</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Explainability:</strong> Feature Importance / SHAP values</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Database:</strong> SQLite with SQLAlchemy ORM</li>
            <li style={{ display: 'flex', gap: '8px' }}><strong>Data Validation:</strong> Pydantic models</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Key Features</div>
          <Shield size={18} color="var(--color-low-risk)" />
        </div>
        <div className="grid-3" style={{ gap: '24px' }}>
          <div>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: '0.95rem' }}>Explainable AI (XAI)</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Instead of a "black box" prediction, the system explains <em>why</em> an applicant received a specific score by quantifying the impact of individual features.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: '0.95rem' }}>Model Comparison</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Evaluates multiple algorithms (Logistic Regression, Trees, Ensembles) and automatically deploys the best performing model based on business-relevant metrics.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: '0.95rem' }}>Responsible AI Analysis</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Includes built-in fairness checks to detect potential statistical disparities across demographic groups in the historical dataset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
