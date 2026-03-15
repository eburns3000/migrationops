import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Server, ShieldAlert, Layers, Activity, TrendingUp, ArrowRight,
} from 'lucide-react';
import { reportsApi, workloadsApi } from '../services/api';
import { PortfolioMetrics, WorkloadWithAssessment } from '../types';
import { MetricCard } from '../components/ui/MetricCard';
import { Card, CardHeader } from '../components/ui/Card';
import { StrategyBadge, RiskBadge, WaveBadge, StatusBadge } from '../components/ui/Badge';

const STRATEGY_COLORS: Record<string, string> = {
  Rehost: '#3b82f6',
  Replatform: '#6366f1',
  Refactor: '#8b5cf6',
  Retain: '#10b981',
  Retire: '#94a3b8',
};

const RISK_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [workloads, setWorkloads] = useState<WorkloadWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.getMetrics(), workloadsApi.list()])
      .then(([m, w]) => {
        setMetrics(m);
        setWorkloads(w);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading portfolio…</p>
        </div>
      </div>
    );
  }

  const strategyData = metrics
    ? Object.entries(metrics.strategyDistribution)
        .filter(([, count]) => count > 0)
        .map(([name, count]) => ({ name, count, fill: STRATEGY_COLORS[name] }))
    : [];

  const waveData = metrics
    ? Object.entries(metrics.waveDistribution).map(([name, count]) => ({ name, count }))
    : [];

  const riskData = metrics
    ? Object.entries(metrics.riskDistribution).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        fill: RISK_COLORS[name],
      }))
    : [];

  const readiness = metrics?.readinessScore ?? 0;
  const readinessColor =
    readiness >= 75 ? 'text-emerald-600' : readiness >= 50 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-5">
        <MetricCard
          label="Total Workloads"
          value={metrics?.totalWorkloads ?? 0}
          subtext={`${metrics?.assessedCount ?? 0} assessed`}
          icon={Server}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <MetricCard
          label="Migration Readiness"
          value={`${readiness}%`}
          subtext="Portfolio score"
          icon={TrendingUp}
          iconBg={readiness >= 75 ? 'bg-emerald-50' : readiness >= 50 ? 'bg-amber-50' : 'bg-red-50'}
          iconColor={readinessColor}
        />
        <MetricCard
          label="High Risk Workloads"
          value={metrics?.riskDistribution.high ?? 0}
          subtext="Require attention"
          icon={ShieldAlert}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <MetricCard
          label="Migration Waves"
          value="3"
          subtext="Planned phases"
          icon={Layers}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Strategy Distribution */}
        <Card>
          <CardHeader title="Strategy Distribution" subtitle="Migration approach breakdown" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={strategyData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
              >
                {strategyData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${v} workloads`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Wave Distribution */}
        <Card>
          <CardHeader title="Wave Distribution" subtitle="Workloads by migration phase" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waveData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v} workloads`, 'Count']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Summary */}
        <Card>
          <CardHeader title="Risk Summary" subtitle="Portfolio risk distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskData} layout="vertical" barSize={24}>
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v: number) => [`${v} workloads`, 'Count']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Quick stats */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            {riskData.map((r) => (
              <div key={r.name}>
                <p className="text-lg font-bold text-slate-800">{r.count}</p>
                <p className="text-xs text-slate-500">{r.name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Migration Readiness Bar */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-indigo-600" />
            <span className="text-sm font-semibold text-slate-800">Portfolio Readiness Score</span>
          </div>
          <span className={`text-2xl font-bold ${readinessColor}`}>{readiness}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              readiness >= 75
                ? 'bg-emerald-500'
                : readiness >= 50
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${readiness}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>0 — Not Ready</span>
          <span>50 — Moderate</span>
          <span>100 — Fully Ready</span>
        </div>
      </Card>

      {/* Portfolio Table */}
      <Card padding="none">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Application Portfolio</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {workloads.length} workloads · RetailCo migration program
            </p>
          </div>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View assessments <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-3">
                  Workload
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                  Strategy
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                  Wave
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                  Risk
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                  Complexity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workloads.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{w.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{w.businessFunction}</p>
                  </td>
                  <td className="px-4 py-4">
                    {w.assessment ? (
                      <StrategyBadge strategy={w.assessment.migrationStrategy} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {w.assessment ? (
                      <WaveBadge wave={w.assessment.wave} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {w.assessment ? (
                      <RiskBadge risk={w.assessment.riskLevel} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {w.assessment ? (
                      <StatusBadge status={w.assessment.status} />
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {w.assessment ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500"
                            style={{ width: `${(w.assessment.complexityScore / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-6">
                          {w.assessment.complexityScore}/10
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
