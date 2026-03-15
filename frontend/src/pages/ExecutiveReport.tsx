import { useEffect, useState } from 'react';
import { reportsApi } from '../services/api';
import { ExecutiveReport } from '../types';
import { Card } from '../components/ui/Card';
import {
  FileText, Sparkles, Clock, RefreshCw, TrendingUp,
  AlertTriangle, Layers, BookOpen,
} from 'lucide-react';

function ReportSection({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  content,
}: {
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  title: string;
  content: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
        </div>
      </div>
    </Card>
  );
}

export default function ExecutiveReportPage() {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .getLatest()
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const r = await reportsApi.generate();
      setReport(r);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Report generation failed. Ensure ANTHROPIC_API_KEY is configured in .env.';
      setError(msg ?? 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const readinessColor = (score: number) =>
    score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500';

  const readinessBg = (score: number) =>
    score >= 75 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="max-w-3xl space-y-6">
      {/* Generate control */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Executive Migration Briefing</h2>
            <p className="text-sm text-slate-500 mt-1">
              AI-generated portfolio summary for C-suite and board presentation.
              Powered by Claude claude-sonnet-4-20250514.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors flex-shrink-0 ml-4"
          >
            {generating ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                {report ? 'Regenerate Report' : 'Generate Report'}
              </>
            )}
          </button>
        </div>

        {generating && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <RefreshCw size={16} className="text-indigo-500 animate-spin" />
            <p className="text-sm text-indigo-700">
              Claude is generating your executive briefing… this takes 15–30 seconds.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Generation failed</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !report && !generating && (
        <Card>
          <div className="py-16 text-center">
            <FileText size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold mb-1">No report generated yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Click "Generate Report" to create an AI-authored executive briefing from the current
              portfolio assessment data.
            </p>
            <p className="text-xs text-slate-300">
              Requires ANTHROPIC_API_KEY to be set in backend .env
            </p>
          </div>
        </Card>
      )}

      {report && (
        <>
          {/* Report header */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                    AI-Generated Report
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  RetailCo Cloud Migration Program
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Executive Summary · {report.workloadCount} workloads assessed
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${readinessBg(report.readinessScore)}`}
                >
                  <TrendingUp size={16} className={readinessColor(report.readinessScore)} />
                  <div>
                    <p className={`text-xl font-bold ${readinessColor(report.readinessScore)}`}>
                      {report.readinessScore}%
                    </p>
                    <p className="text-xs text-slate-500">Readiness</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} />
              Generated {new Date(report.generatedAt).toLocaleString()}
            </div>
          </Card>

          {/* Executive Summary — highlighted section */}
          <div className="bg-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-indigo-200" />
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">
                Executive Summary
              </p>
            </div>
            <p className="text-base leading-relaxed text-indigo-50">{report.executiveSummary}</p>
          </div>

          {/* Report sections */}
          <ReportSection
            icon={FileText}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            title="Migration Overview"
            content={report.migrationOverview}
          />
          <ReportSection
            icon={TrendingUp}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            title="Strategy Summary"
            content={report.strategySummary}
          />
          <ReportSection
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            title="Key Risks"
            content={report.keyRisks}
          />
          <ReportSection
            icon={Layers}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            title="Sequencing Recommendations"
            content={report.sequencingRecommendations}
          />

          {/* Report footer */}
          <div className="text-center text-xs text-slate-400 pb-4">
            <p>
              This report was generated by Claude claude-sonnet-4-20250514 via MigrationOps.
              Content should be reviewed by a qualified cloud architect before use in formal planning.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
