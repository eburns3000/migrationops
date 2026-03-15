import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { workloadsApi } from '../services/api';
import { CreateWorkloadPayload } from '../types';
import { Card } from '../components/ui/Card';

const EMPTY_FORM: CreateWorkloadPayload = {
  name: '',
  businessFunction: '',
  currentHosting: '',
  architectureType: '',
  databaseType: '',
  businessCriticality: 'medium',
  dependencyLevel: 'medium',
  complianceSensitivity: 'low',
  downtimeTolerance: 'medium',
  latencySensitivity: 'medium',
  trafficPattern: 'steady',
  modernizationNeed: 'medium',
  integrationComplexity: 'medium',
  ownerTeam: '',
  notes: '',
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function WorkloadIntake() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateWorkloadPayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof CreateWorkloadPayload) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value as never }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.businessFunction.trim()) {
      setError('Application name and business function are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await workloadsApi.create(form);
      setSuccess(`"${created.name}" added to portfolio. Navigate to AI Assessment to analyze it.`);
      setForm(EMPTY_FORM);
    } catch {
      setError('Failed to save workload. Ensure the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Banner alerts */}
      {success && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">{success}</p>
            <button
              onClick={() => navigate('/assessment')}
              className="text-sm text-emerald-700 underline mt-1"
            >
              Go to AI Assessment →
            </button>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 text-xs">✕</button>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs ml-auto">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">
            Application Identity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label required>Application Name</Label>
              <Input value={form.name} onChange={set('name')} placeholder="e.g. Order Management System" />
            </div>
            <div className="col-span-2">
              <Label required>Business Function</Label>
              <Input
                value={form.businessFunction}
                onChange={set('businessFunction')}
                placeholder="e.g. Processes and tracks customer orders end-to-end"
              />
            </div>
            <div>
              <Label>Owner / Team</Label>
              <Input value={form.ownerTeam} onChange={set('ownerTeam')} placeholder="e.g. Platform Engineering" />
            </div>
          </div>
        </Card>

        {/* Current Environment */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">
            Current Environment
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hosting Environment</Label>
              <Input
                value={form.currentHosting}
                onChange={set('currentHosting')}
                placeholder="e.g. On-premises VMs, Bare metal"
              />
            </div>
            <div>
              <Label>Architecture Type</Label>
              <Input
                value={form.architectureType}
                onChange={set('architectureType')}
                placeholder="e.g. Monolith, Microservices, SaaS"
              />
            </div>
            <div>
              <Label>Database Type</Label>
              <Input
                value={form.databaseType}
                onChange={set('databaseType')}
                placeholder="e.g. MySQL, PostgreSQL, Oracle"
              />
            </div>
          </div>
        </Card>

        {/* Assessment Attributes */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">
            Migration Assessment Attributes
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Business Criticality</Label>
              <Select
                value={form.businessCriticality}
                onChange={set('businessCriticality')}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />
            </div>
            <div>
              <Label>Dependency Level</Label>
              <Select
                value={form.dependencyLevel}
                onChange={set('dependencyLevel')}
                options={[
                  { value: 'low', label: 'Low — few integrations' },
                  { value: 'medium', label: 'Medium — some integrations' },
                  { value: 'high', label: 'High — many dependencies' },
                ]}
              />
            </div>
            <div>
              <Label>Compliance Sensitivity</Label>
              <Select
                value={form.complianceSensitivity}
                onChange={set('complianceSensitivity')}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium (PII, SOX)' },
                  { value: 'high', label: 'High (PCI-DSS, HIPAA)' },
                ]}
              />
            </div>
            <div>
              <Label>Downtime Tolerance</Label>
              <Select
                value={form.downtimeTolerance}
                onChange={set('downtimeTolerance')}
                options={[
                  { value: 'none', label: 'None — zero downtime required' },
                  { value: 'low', label: 'Low — hours' },
                  { value: 'medium', label: 'Medium — days' },
                  { value: 'high', label: 'High — weeks' },
                ]}
              />
            </div>
            <div>
              <Label>Latency Sensitivity</Label>
              <Select
                value={form.latencySensitivity}
                onChange={set('latencySensitivity')}
                options={[
                  { value: 'low', label: 'Low — batch / async' },
                  { value: 'medium', label: 'Medium — seconds acceptable' },
                  { value: 'high', label: 'High — sub-second required' },
                ]}
              />
            </div>
            <div>
              <Label>Traffic Pattern</Label>
              <Select
                value={form.trafficPattern}
                onChange={set('trafficPattern')}
                options={[
                  { value: 'steady', label: 'Steady — consistent load' },
                  { value: 'variable', label: 'Variable — predictable peaks' },
                  { value: 'bursty', label: 'Bursty — unpredictable spikes' },
                ]}
              />
            </div>
            <div>
              <Label>Modernization Need</Label>
              <Select
                value={form.modernizationNeed}
                onChange={set('modernizationNeed')}
                options={[
                  { value: 'low', label: 'Low — works well as-is' },
                  { value: 'medium', label: 'Medium — some improvements needed' },
                  { value: 'high', label: 'High — significant technical debt' },
                ]}
              />
            </div>
            <div>
              <Label>Integration Complexity</Label>
              <Select
                value={form.integrationComplexity}
                onChange={set('integrationComplexity')}
                options={[
                  { value: 'low', label: 'Low — standalone or simple APIs' },
                  { value: 'medium', label: 'Medium — several integrations' },
                  { value: 'high', label: 'High — complex integration mesh' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <Label>Additional Notes</Label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
            rows={4}
            placeholder="Any relevant context about architecture, known risks, business constraints, or migration considerations…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Assessment will be triggered manually from the AI Assessment page.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Add to Portfolio
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
