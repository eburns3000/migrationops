import { MigrationStrategy, RiskLevel, MigrationWave, AssessmentStatus } from '../../types';

// ─── Strategy Badge ───────────────────────────────────────────────────────────

const strategyStyles: Record<MigrationStrategy, string> = {
  Rehost: 'bg-blue-50 text-blue-700 ring-blue-200',
  Replatform: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Refactor: 'bg-purple-50 text-purple-700 ring-purple-200',
  Retain: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Retire: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function StrategyBadge({ strategy }: { strategy: MigrationStrategy }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${strategyStyles[strategy]}`}
    >
      {strategy}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────

const riskStyles: Record<RiskLevel, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  high: 'bg-red-50 text-red-700 ring-red-200',
};

const riskDots: Record<RiskLevel, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-red-400',
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${riskStyles[risk]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${riskDots[risk]}`} />
      {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
    </span>
  );
}

// ─── Wave Badge ───────────────────────────────────────────────────────────────

const waveStyles: Record<MigrationWave, string> = {
  'Wave 1': 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  'Wave 2': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Wave 3': 'bg-orange-50 text-orange-700 ring-orange-200',
};

export function WaveBadge({ wave }: { wave: MigrationWave }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${waveStyles[wave]}`}
    >
      {wave}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<AssessmentStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 ring-slate-200',
  assessed: 'bg-blue-50 text-blue-700 ring-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  overridden: 'bg-amber-50 text-amber-700 ring-amber-200',
};

const statusLabels: Record<AssessmentStatus, string> = {
  pending: 'Pending',
  assessed: 'Assessed',
  approved: 'Approved',
  overridden: 'Overridden',
};

export function StatusBadge({ status }: { status: AssessmentStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

// ─── Generic Badge ────────────────────────────────────────────────────────────

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple';
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 ring-slate-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ring-inset ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
