import { useEffect, useState } from 'react';
import {
  Brain, RefreshCw, CheckCircle, AlertTriangle, Info,
  ChevronDown, Shield, Zap, Server,
} from 'lucide-react';
import { workloadsApi, assessmentsApi } from '../services/api';
import { WorkloadWithAssessment, Assessment, MigrationStrategy } from '../types';
import { Card } from '../components/ui/Card';
import { StrategyBadge, RiskBadge, WaveBadge, StatusBadge } from '../components/ui/Badge';

const STRATEGIES: MigrationStrategy[] = ['Rehost', 'Replatform', 'Refactor', 'Retain', 'Retire'];

export default function AssessmentResults() {
  const [workloads, setWorkloads] = useState<WorkloadWithAssessment[]>([]);
  const [selected, setSelected] = useState<WorkloadWithAssessment | null>(null);
  const [running, setRunning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [overrideStrategy, setOverrideStrategy] = useState<MigrationStrategy | ''>('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => {
    workloadsApi.list().then((ws) => {
      setWorkloads(ws);
      if (ws.length > 0) setSelected(ws[0]);
    });
  }, []);

  const refreshSelected = async (id: string) => {
    const fresh = await workloadsApi.get(id);
    setWorkloads((ws) => ws.map((w) => (w.id === id ? fresh : w)));
    setSelected(fresh);
  };

  const handleRunAssessment = async () => {
    if (!selected) return;
    setRunning(true);
    setAiError(null);
    try {
      await assessmentsApi.runAssessment(selected.id);
      await refreshSelected(selected.id);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'AI assessment failed. Check your ANTHROPIC_API_KEY in .env and restart the backend.';
      setAiError(msg ?? 'Assessment failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleApprove = async () => {
    if (!selected?.assessment) return;
    setApproving(true);
    try {
      await assessmentsApi.approve(selected.assessment.id, {
        status: 'approved',
        reviewerNote: reviewerNote || undefined,
        approvedBy: 'Migration Reviewer',
      });
      await refreshSelected(selected.id);
      setReviewerNote('');
    } finally {
      setApproving(false);
    }
  };

  const handleOverride = async () => {
    if (!selected?.assessment || !overrideStrategy) return;
    setApproving(true);
    try {
      await assessmentsApi.approve(selected.assessment.id, {
        status: 'overridden',
        overriddenStrategy: overrideStrategy,
        reviewerNote: reviewerNote || undefined,
        approvedBy: 'Migration Reviewer',
      });
      await refreshSelected(selected.id);
      setReviewerNote('');
      setOverrideStrategy('');
      setShowOverride(false);
    } finally {
      setApproving(false);
    }
  };

  const a: Assessment | undefined = selected?.assessment;

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar — workload list */}
      <div className="w-64 flex-shrink-0">
        <Card padding="none" className="sticky top-24">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Portfolio ({workloads.length})
            </p>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            {workloads.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setSelected(w);
                  setAiError(null);
                  setShowOverride(false);
                }}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${
                  selected?.id === w.id
                    ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
                    : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-medium text-slate-800 truncate">{w.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {w.assessment ? (
                    <>
                      <span className="text-xs text-slate-500">{w.assessment.migrationStrategy}</span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`text-xs font-medium ${
                          w.assessment.riskLevel === 'high'
                            ? 'text-red-500'
                            : w.assessment.riskLevel === 'medium'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      >
                        {w.assessment.riskLevel} risk
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">No assessment</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-5 min-w-0">
        {!selected ? (
          <Card>
            <p className="text-slate-500 text-sm text-center py-8">Select a workload to view its assessment.</p>
          </Card>
        ) : (
          <>
            {/* Workload header */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{selected.businessFunction}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Server size={12} /> {selected.currentHosting}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={12} /> {selected.architectureType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={12} /> {selected.complianceSensitivity} compliance
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {a && <StatusBadge status={a.status} />}
                  <button
                    onClick={handleRunAssessment}
                    disabled={running}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {running ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Brain size={15} />
                        {a ? 'Re-run AI Assessment' : 'Run AI Assessment'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {running && (
                <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-center gap-3">
                  <RefreshCw size={16} className="text-indigo-500 animate-spin" />
                  <p className="text-sm text-indigo-700">
                    Claude is analyzing this workload… this takes 10–20 seconds.
                  </p>
                </div>
              )}

              {aiError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Assessment failed</p>
                    <p className="text-xs text-red-600 mt-0.5">{aiError}</p>
                  </div>
                </div>
              )}
            </Card>

            {!a ? (
              <Card>
                <div className="py-12 text-center">
                  <Brain size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No assessment yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Click "Run AI Assessment" to analyze this workload with Claude.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <Card padding="sm">
                    <p className="text-xs text-slate-500 mb-1.5">Migration Strategy</p>
                    <StrategyBadge strategy={a.migrationStrategy} />
                    {a.overriddenStrategy && (
                      <div className="mt-2">
                        <p className="text-xs text-amber-600 font-medium">Overridden to:</p>
                        <StrategyBadge strategy={a.overriddenStrategy} />
                      </div>
                    )}
                  </Card>
                  <Card padding="sm">
                    <p className="text-xs text-slate-500 mb-1.5">Migration Wave</p>
                    <WaveBadge wave={a.wave} />
                  </Card>
                  <Card padding="sm">
                    <p className="text-xs text-slate-500 mb-1.5">Risk Level</p>
                    <RiskBadge risk={a.riskLevel} />
                  </Card>
                  <Card padding="sm">
                    <p className="text-xs text-slate-500 mb-1.5">Confidence Score</p>
                    <p className="text-2xl font-bold text-slate-900">{a.confidenceScore}%</p>
                    <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${a.confidenceScore}%` }}
                      />
                    </div>
                  </Card>
                </div>

                {/* Complexity */}
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-800">Complexity Score</p>
                    <span className="text-2xl font-bold text-slate-900">
                      {a.complexityScore}<span className="text-base font-normal text-slate-400">/10</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        a.complexityScore >= 8
                          ? 'bg-red-500'
                          : a.complexityScore >= 5
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(a.complexityScore / 10) * 100}%` }}
                    />
                  </div>
                </Card>

                {/* Risk Factors */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-900">Identified Risk Factors</h3>
                  </div>
                  <ul className="space-y-2">
                    {a.riskFactors.map((rf, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-700">{rf}</p>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Reasoning summary */}
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={16} className="text-indigo-500" />
                    <h3 className="text-sm font-semibold text-slate-900">AI Reasoning Summary</h3>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{a.reasoningSummary}</p>
                </Card>

                {/* AWS Architecture */}
                <Card>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Recommended AWS Target Architecture
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {a.awsTargetArchitecture.map((svc) => (
                      <span
                        key={svc}
                        className="inline-flex items-center px-3 py-1 bg-slate-800 text-slate-100 rounded-lg text-xs font-medium"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Architecture Rationale
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.architectureRationale}</p>
                  </div>
                </Card>

                {/* Approval / Override */}
                {a.status !== 'approved' && (
                  <Card>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">
                      Reviewer Decision
                    </h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Reviewer Note (optional)
                      </label>
                      <textarea
                        value={reviewerNote}
                        onChange={(e) => setReviewerNote(e.target.value)}
                        rows={3}
                        placeholder="Add context, concerns, or approval rationale…"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={approving}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                      >
                        <CheckCircle size={15} />
                        {approving ? 'Saving…' : 'Approve Recommendation'}
                      </button>

                      <button
                        onClick={() => setShowOverride(!showOverride)}
                        className="inline-flex items-center gap-2 border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                      >
                        Override Strategy
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${showOverride ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    {showOverride && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-3">
                          Select the strategy you want to override to:
                        </p>
                        <div className="flex items-center gap-3">
                          <select
                            value={overrideStrategy}
                            onChange={(e) =>
                              setOverrideStrategy(e.target.value as MigrationStrategy)
                            }
                            className="rounded-lg border border-amber-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                          >
                            <option value="">Select strategy…</option>
                            {STRATEGIES.filter((s) => s !== a.migrationStrategy).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleOverride}
                            disabled={!overrideStrategy || approving}
                            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                          >
                            Apply Override
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Approved state */}
                {(a.status === 'approved' || a.status === 'overridden') && (
                  <Card>
                    <div className="flex items-start gap-3">
                      <CheckCircle
                        size={18}
                        className={a.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {a.status === 'approved' ? 'Recommendation Approved' : 'Strategy Overridden'}
                        </p>
                        {a.approvedBy && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            By {a.approvedBy} ·{' '}
                            {a.approvedAt ? new Date(a.approvedAt).toLocaleString() : ''}
                          </p>
                        )}
                        {a.reviewerNote && (
                          <p className="text-sm text-slate-700 mt-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                            "{a.reviewerNote}"
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
