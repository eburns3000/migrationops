import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import WorkloadIntake from './pages/WorkloadIntake';
import AssessmentResults from './pages/AssessmentResults';
import WavePlanner from './pages/WavePlanner';
import RiskDashboard from './pages/RiskDashboard';
import ArchitectureRecommendations from './pages/ArchitectureRecommendations';
import ExecutiveReport from './pages/ExecutiveReport';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="intake" element={<WorkloadIntake />} />
          <Route path="assessment" element={<AssessmentResults />} />
          <Route path="waves" element={<WavePlanner />} />
          <Route path="risks" element={<RiskDashboard />} />
          <Route path="architecture" element={<ArchitectureRecommendations />} />
          <Route path="report" element={<ExecutiveReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
