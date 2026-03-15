import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive?: boolean };
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50',
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1.5">{value}</p>
          {subtext && <p className="text-sm text-slate-500 mt-1">{subtext}</p>}
          {trend && (
            <p
              className={`text-xs font-medium mt-2 ${
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 ml-4`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

// Compact version for inside cards
export function MiniMetric({
  label,
  value,
  color = 'text-slate-900',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
