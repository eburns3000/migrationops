import { useEffect, useState } from 'react';
import { wavesApi } from '../services/api';
import { WorkloadWithAssessment, WaveData, MigrationWave } from '../types';
import { Card } from '../components/ui/Card';
import { StrategyBadge, RiskBadge } from '../components/ui/Badge';
import { Layers, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const WAVE_CONFIG: Record<
  MigrationWave,
  { label: string; timeframe: string; color: string; bg: string; border: string; icon: string }
> = {
  'Wave 1': {
    label: 'Wave 1 — Foundation',
    timeframe: 'Months 1–3',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: '🟢',
  },
  'Wave 2': {
    label: 'Wave 2 — Replatform',
    timeframe: 'Months 3–6',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: '🔵',
  },
  'Wave 3': {
    label: 'Wave 3 — Transform',
    timeframe: 'Months 6–12',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: '🟣',
  },
};

const WAVE_RATIONALE: Record<MigrationWave, string> = {
  'Wave 1':
    'Low-complexity workloads and SaaS retentions. Establishes AWS network, security, and operational foundation. Quick wins build team confidence and demonstrate ROI.',
  'Wave 2':
    'Moderate-complexity replatform candidates. Benefits from Wave 1 network and security baseline. Containerization and managed services deliver measurable cost and reliability improvements.',
  'Wave 3':
    'High-complexity refactors and critical systems. Requires stable Wave 1/2 infrastructure. Delivers the highest long-term business value through cloud-native architectures.',
};

function WorkloadCard({ workload }: { workload: WorkloadWithAssessment }) {
  const a = workload.assessment;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-900 leading-tight">{workload.name}</p>
        {a && <StrategyBadge strategy={a.migrationStrategy} />}
      </div>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{workload.businessFunction}</p>
      <div className="flex flex-wrap items-center gap-2">
        {a && <RiskBadge risk={a.riskLevel} />}
        {a && (
          <span className="text-xs text-slate-400">
            Complexity: {a.complexityScore}/10
          </span>
        )}
      </div>
      {a && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {a.status === 'approved' ? (
              <CheckCircle2 size={12} className="text-emerald-500" />
            ) : a.riskLevel === 'high' ? (
              <AlertTriangle size={12} className="text-amber-500" />
            ) : null}
            <span className="truncate">
              {a.status === 'approved'
                ? 'Approved'
                : a.riskLevel === 'high'
                ? 'High risk — review required'
                : workload.currentHosting}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function WaveColumn({
  wave,
  workloads,
}: {
  wave: MigrationWave;
  workloads: WorkloadWithAssessment[];
}) {
  const cfg = WAVE_CONFIG[wave];
  return (
    <div className={`flex-1 rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
      {/* Column header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white border ${cfg.border} ${cfg.color}`}>
            {workloads.length} workloads
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={11} />
          <span>{cfg.timeframe}</span>
        </div>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{WAVE_RATIONALE[wave]}</p>
      </div>

      {/* Workload cards */}
      <div className="space-y-3">
        {workloads.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-6 text-center">
            <p className="text-xs text-slate-400">No workloads in this wave</p>
          </div>
        ) : (
          workloads.map((w) => <WorkloadCard key={w.id} workload={w} />)
        )}
      </div>
    </div>
  );
}

export default function WavePlanner() {
  const [waves, setWaves] = useState<WaveData | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wavesApi.getWaves().then(({ data, summary: s }) => {
      setWaves(data);
      setSummary(s);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4">
        {(['Wave 1', 'Wave 2', 'Wave 3'] as MigrationWave[]).map((w) => {
          const cfg = WAVE_CONFIG[w];
          return (
            <div key={w} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
              <p className={`text-xs font-semibold ${cfg.color} mb-1`}>{w}</p>
              <p className="text-2xl font-bold text-slate-900">{summary[w] ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">{cfg.timeframe}</p>
            </div>
          );
        })}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500">Total Portfolio</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary.total ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary.unassigned ? `${summary.unassigned} unassigned` : 'All assigned'}
          </p>
        </div>
      </div>

      {/* Wave columns */}
      {waves && (
        <div className="flex gap-5 items-start">
          {(['Wave 1', 'Wave 2', 'Wave 3'] as MigrationWave[]).map((w) => (
            <WaveColumn key={w} wave={w} workloads={waves[w]} />
          ))}
        </div>
      )}

      {/* Unassigned */}
      {waves && waves.unassigned.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Unassigned Workloads ({waves.unassigned.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {waves.unassigned.map((w) => (
              <WorkloadCard key={w.id} workload={w} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
