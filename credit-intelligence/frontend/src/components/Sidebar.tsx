import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  History,
  Shield,
  BookOpen,
  Brain,
  Activity,
  Zap,
} from 'lucide-react';

const navItems = [
  {
    section: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/assessment', label: 'Credit Assessment', icon: ClipboardCheck },
      { to: '/history', label: 'Prediction History', icon: History },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { to: '/model-analytics', label: 'Model Analytics', icon: BarChart3 },
      { to: '/explainability', label: 'Explainability', icon: Brain },
      { to: '/monitoring', label: 'Model Monitoring', icon: Activity },
    ],
  },
  {
    section: 'Governance',
    items: [
      { to: '/responsible-ai', label: 'Responsible AI', icon: Shield },
      { to: '/about', label: 'Documentation', icon: BookOpen },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="white" />
          </div>
          <h1>Credit Intelligence</h1>
        </div>
        <p>Explainable AI · Credit Risk</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '4px' }}>Version 1.0.0 · German Credit Dataset</div>
        <div style={{ color: '#475569' }}>Educational / Portfolio Use Only</div>
      </div>
    </aside>
  );
}
