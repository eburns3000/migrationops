import { useEffect, useState } from 'react';
import { workloadsApi } from '../services/api';
import { WorkloadWithAssessment } from '../types';
import { Card } from '../components/ui/Card';
import { StrategyBadge, WaveBadge, RiskBadge } from '../components/ui/Badge';
import { Network, Server, Info, ChevronDown, ChevronUp } from 'lucide-react';

const SERVICE_CATEGORY: Record<string, string> = {
  // Compute
  'ECS Fargate': 'compute',
  'EC2': 'compute',
  'Lambda': 'compute',
  'EKS': 'compute',
  // Database
  'RDS MySQL': 'database',
  'RDS PostgreSQL': 'database',
  'RDS Oracle': 'database',
  'RDS Oracle Multi-AZ': 'database',
  'Aurora': 'database',
  'Aurora PostgreSQL': 'database',
  'RDS Aurora PostgreSQL': 'database',
  'DynamoDB': 'database',
  'DocumentDB': 'database',
  'Amazon DocumentDB': 'database',
  'ElastiCache Redis': 'cache',
  'ElastiCache': 'cache',
  'Redis': 'cache',
  // Networking
  'ALB': 'networking',
  'CloudFront': 'networking',
  'API Gateway': 'networking',
  'WAF': 'security',
  'WAF + Shield': 'security',
  'Route 53': 'networking',
  'VPC': 'networking',
  'Direct Connect': 'networking',
  'PrivateLink': 'networking',
  // Storage
  'S3': 'storage',
  'EFS': 'storage',
  'AWS Backup': 'storage',
  // Analytics
  'AWS Glue': 'analytics',
  'Amazon Athena': 'analytics',
  'EMR': 'analytics',
  'Amazon QuickSight': 'analytics',
  'Kinesis Data Streams': 'analytics',
  'Lake Formation': 'analytics',
  // ML
  'SageMaker': 'ml',
  'SageMaker Feature Store': 'ml',
  // Integration
  'SQS': 'integration',
  'SNS': 'integration',
  'EventBridge': 'integration',
  'Amazon EventBridge': 'integration',
  'Step Functions': 'integration',
  // Security
  'KMS': 'security',
  'AWS KMS': 'security',
  'Secrets Manager': 'security',
  'CloudHSM': 'security',
  'IAM': 'security',
  'CloudTrail': 'observability',
  'Config': 'observability',
  // Operations
  'CloudWatch': 'observability',
  'X-Ray': 'observability',
  'Systems Manager': 'operations',
  // Messaging
  'Amazon SES': 'integration',
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  compute: { bg: 'bg-blue-100', text: 'text-blue-800' },
  database: { bg: 'bg-violet-100', text: 'text-violet-800' },
  cache: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  networking: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  storage: { bg: 'bg-amber-100', text: 'text-amber-800' },
  analytics: { bg: 'bg-orange-100', text: 'text-orange-800' },
  ml: { bg: 'bg-pink-100', text: 'text-pink-800' },
  integration: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  security: { bg: 'bg-red-100', text: 'text-red-800' },
  observability: { bg: 'bg-slate-200', text: 'text-slate-700' },
  operations: { bg: 'bg-slate-200', text: 'text-slate-700' },
  default: { bg: 'bg-slate-100', text: 'text-slate-700' },
};

function ServiceChip({ service }: { service: string }) {
  const category = SERVICE_CATEGORY[service] || 'default';
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${style.bg} ${style.text}`}>
      {service}
    </span>
  );
}

function WorkloadArchCard({ workload }: { workload: WorkloadWithAssessment }) {
  const [expanded, setExpanded] = useState(false);
  const a = workload.assessment;

  if (!a) {
    return (
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">{workload.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{workload.businessFunction}</p>
          </div>
          <span className="text-xs text-slate-400">No assessment</span>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div
        className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{workload.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{workload.businessFunction}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StrategyBadge strategy={a.migrationStrategy} />
            <WaveBadge wave={a.wave} />
            <RiskBadge risk={a.riskLevel} />
            {expanded ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </div>
        </div>

        {/* Service chips always visible */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {a.awsTargetArchitecture.map((svc) => (
            <ServiceChip key={svc} service={svc} />
          ))}
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <div className="flex items-start gap-2 mb-2">
            <Info size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Architecture Rationale
            </p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{a.architectureRationale}</p>

          {/* Workload metadata */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Current Stack</p>
              <p className="text-xs font-medium text-slate-700">{workload.architectureType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Database</p>
              <p className="text-xs font-medium text-slate-700">{workload.databaseType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Owner</p>
              <p className="text-xs font-medium text-slate-700">{workload.ownerTeam}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ArchitectureRecommendations() {
  const [workloads, setWorkloads] = useState<WorkloadWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

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

  const strategies = ['all', 'Rehost', 'Replatform', 'Refactor', 'Retain'];

  const filtered =
    filter === 'all'
      ? workloads.filter((w) => w.assessment)
      : workloads.filter((w) => w.assessment?.migrationStrategy === filter);

  // Collect all unique services across portfolio
  const allServices = new Set<string>();
  workloads.forEach((w) => w.assessment?.awsTargetArchitecture.forEach((s) => allServices.add(s)));

  // Count service frequency
  const serviceFreq: Record<string, number> = {};
  workloads.forEach((w) =>
    w.assessment?.awsTargetArchitecture.forEach((s) => {
      serviceFreq[s] = (serviceFreq[s] || 0) + 1;
    })
  );
  const topServices = Object.entries(serviceFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Network size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{allServices.size}</p>
              <p className="text-xs text-slate-500">Unique AWS services</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Server size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {workloads.filter((w) => w.assessment).length}
              </p>
              <p className="text-xs text-slate-500">Workloads with architecture</p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-slate-500 mb-2">Most Used Services</p>
          <div className="flex flex-wrap gap-1.5">
            {topServices.slice(0, 4).map(([svc]) => (
              <ServiceChip key={svc} service={svc} />
            ))}
          </div>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {strategies.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'All Workloads' : s}
            <span className="ml-2 text-xs opacity-70">
              {s === 'all'
                ? workloads.filter((w) => w.assessment).length
                : workloads.filter((w) => w.assessment?.migrationStrategy === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Workload architecture cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400 text-center py-8">
              No workloads with {filter} strategy.
            </p>
          </Card>
        ) : (
          filtered.map((w) => <WorkloadArchCard key={w.id} workload={w} />)
        )}
      </div>

      {/* Service frequency legend */}
      <Card>
        <p className="text-sm font-semibold text-slate-800 mb-3">Top AWS Services by Usage</p>
        <div className="space-y-2">
          {topServices.map(([svc, count]) => (
            <div key={svc} className="flex items-center gap-3">
              <ServiceChip service={svc} />
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-indigo-500"
                  style={{
                    width: `${(count / topServices[0][1]) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 w-20 text-right">
                {count} workload{count !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
