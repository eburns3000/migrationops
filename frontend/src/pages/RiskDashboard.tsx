import { useEffect, useState } from 'react';
import { workloadsApi } from '../services/api';
import { WorkloadWithAssessment } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { RiskBadge, StrategyBadge, WaveBadge } from '../components/ui/Badge';
import { ShieldAlert, Link2, FileWarning, AlertTriangle } from 'lucide-react';

export default function RiskDashboard() {
  const [workloads, setWorkloads] = useState<WorkloadWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workloadsApi.list().then(setWorkloads).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const assessed = workloads.filter((w) => w.assessment);
  const highRisk = assessed.filter((w) => w.assessment!.riskLevel === 'high');
  const mediumRisk = assessed.filter((w) => w.assessment!.riskLevel === 'medium');
  const highDependency = workloads.filter((w) => w.dependencyLevel === 'high');
  const complianceSensitive = workloads.filter(
    (w) => w.complianceSensitivity === 'high' || w.complianceSensitivity === 'medium'
  );
  const zeroDowntime = workloads.filter((w) => w.downtimeTolerance === 'none');

  const allRiskFactors: { workload: string; factor: string }[] = [];
  for (const w of highRisk) {
    for (const rf of w.assessment!.riskFactors) {
      allRiskFactors.push({ workload: w.name, factor: rf });
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-red-500" />
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">High Risk</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{highRisk.length}</p>
          <p className="text-xs text-red-500 mt-1">Require immediate review</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Medium Risk</p>
          </div>
          <p className="text-3xl font-bold text-amber-700">{mediumRisk.length}</p>
          <p className="text-xs text-amber-500 mt-1">Monitor and mitigate</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={16} className="text-violet-500" />
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">High Dependency</p>
          </div>
          <p className="text-3xl font-bold text-violet-700">{highDependency.length}</p>
          <p className="text-xs text-violet-500 mt-1">Complex integration mesh</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileWarning size={16} className="text-blue-500" />
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Compliance Flags</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{complianceSensitive.length}</p>
          <p className="text-xs text-blue-500 mt-1">Require compliance review</p>
        </div>
      </div>

      {/* High risk workloads */}
      <Card padding="none">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500" />
            <h3 className="text-base font-semibold text-slate-900">High-Risk Workloads</h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            These workloads require escalated planning and risk mitigation
          </p>
        </div>
        {highRisk.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">No high-risk workloads.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Workload', 'Strategy', 'Wave', 'Risk Factors', 'Complexity'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-3 first:px-6"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {highRisk.map((w) => {
                const a = w.assessment!;
                return (
                  <tr key={w.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                      <p className="text-xs text-slate-400">{w.ownerTeam}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StrategyBadge strategy={a.migrationStrategy} />
                    </td>
                    <td className="px-6 py-4">
                      <WaveBadge wave={a.wave} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600">
                        {a.riskFactors.length} risk factor{a.riskFactors.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {a.riskFactors[0]}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-red-500"
                            style={{ width: `${(a.complexityScore / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{a.complexityScore}/10</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Risk factor detail */}
      {allRiskFactors.length > 0 && (
        <Card>
          <CardHeader
            title="Risk Factor Detail"
            subtitle={`${allRiskFactors.length} risk factors across high-risk workloads`}
          />
          <div className="space-y-2">
            {allRiskFactors.map((rf, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-red-700">{rf.workload} — </span>
                  <span className="text-xs text-red-700">{rf.factor}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dependency-heavy workloads */}
      <Card padding="none">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-violet-500" />
            <h3 className="text-base font-semibold text-slate-900">High-Dependency Workloads</h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Migration sequencing must account for these integration dependencies
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {highDependency.map((w) => (
            <div key={w.id} className="px-6 py-4 flex items-center justify-between hover:bg-violet-50/30">
              <div>
                <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                <p className="text-xs text-slate-400">{w.businessFunction}</p>
              </div>
              <div className="flex items-center gap-3">
                {w.assessment && <StrategyBadge strategy={w.assessment.migrationStrategy} />}
                {w.assessment && <RiskBadge risk={w.assessment.riskLevel} />}
                <span className="text-xs text-slate-400">
                  {w.integrationComplexity} integration
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Compliance-sensitive */}
      <Card padding="none">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileWarning size={16} className="text-blue-500" />
            <h3 className="text-base font-semibold text-slate-900">Compliance-Sensitive Workloads</h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Require security and compliance architecture review before migration
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {complianceSensitive.map((w) => (
            <div key={w.id} className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30">
              <div>
                <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                <p className="text-xs text-slate-400">{w.ownerTeam}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    w.complianceSensitivity === 'high'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {w.complianceSensitivity.toUpperCase()} compliance
                </span>
                {w.downtimeTolerance === 'none' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Zero downtime
                  </span>
                )}
                {w.assessment && <WaveBadge wave={w.assessment.wave} />}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Zero downtime */}
      {zeroDowntime.length > 0 && (
        <Card>
          <CardHeader
            title="Zero Downtime Workloads"
            subtitle="Require blue/green or canary deployment strategies"
          />
          <div className="flex flex-wrap gap-2">
            {zeroDowntime.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {w.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
