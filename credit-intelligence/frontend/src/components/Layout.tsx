import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { api } from '../services/api';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/assessment': 'Credit Assessment',
  '/history': 'Prediction History',
  '/model-analytics': 'Model Analytics',
  '/explainability': 'Explainability',
  '/monitoring': 'Model Monitoring',
  '/responsible-ai': 'Responsible AI',
  '/about': 'Documentation',
};

export default function Layout() {
  const location = useLocation();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    api.getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const title = pageTitles[location.pathname] || 'Credit Intelligence';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-status">
            <div
              className="status-dot"
              style={{
                background: apiStatus === 'online' ? 'var(--color-low-risk)' :
                           apiStatus === 'offline' ? 'var(--color-high-risk)' : '#f59e0b',
                animation: apiStatus === 'online' ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span>
              {apiStatus === 'checking' ? 'Connecting...' :
               apiStatus === 'online' ? 'API Online' : 'API Offline'}
            </span>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
