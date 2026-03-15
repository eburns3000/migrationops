import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Executive Dashboard', subtitle: 'Portfolio overview for RetailCo migration program' },
  '/intake': { title: 'Workload Intake', subtitle: 'Register new workloads for migration assessment' },
  '/assessment': { title: 'AI Assessment Results', subtitle: 'Workload migration analysis powered by Claude' },
  '/waves': { title: 'Migration Wave Planner', subtitle: 'Visualize and manage phased migration sequencing' },
  '/risks': { title: 'Risk & Dependency Dashboard', subtitle: 'Portfolio-wide risk analysis and compliance flags' },
  '/architecture': { title: 'Architecture Recommendations', subtitle: 'Target AWS architecture by workload' },
  '/report': { title: 'Executive Report', subtitle: 'AI-generated portfolio summary for leadership' },
};

export default function Layout() {
  const location = useLocation();
  const page = pageTitles[location.pathname] ?? { title: 'MigrationOps', subtitle: '' };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Page header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{page.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{page.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live · RetailCo</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
