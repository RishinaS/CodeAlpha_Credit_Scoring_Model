import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreditAssessment from './pages/CreditAssessment';
import PredictionHistory from './pages/PredictionHistory';
import ModelAnalytics from './pages/ModelAnalytics';
import Explainability from './pages/Explainability';
import ModelMonitoring from './pages/ModelMonitoring';
import ResponsibleAI from './pages/ResponsibleAI';
import About from './pages/About';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assessment" element={<CreditAssessment />} />
          <Route path="/history" element={<PredictionHistory />} />
          <Route path="/model-analytics" element={<ModelAnalytics />} />
          <Route path="/explainability" element={<Explainability />} />
          <Route path="/monitoring" element={<ModelMonitoring />} />
          <Route path="/responsible-ai" element={<ResponsibleAI />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
