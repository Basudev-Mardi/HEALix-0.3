'use client';

import { useEffect, useState } from 'react';
import { Calendar, ChevronDown, FlaskConical, Printer } from 'lucide-react';
import { patientApiFetch, type LabReportItem } from '@/lib/patient-auth';

export default function LabReportsPage() {
  const [reports, setReports] = useState<LabReportItem[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApiFetch<LabReportItem[]>('/patient/lab-reports').then((res) => {
      if (res.data) {
        setReports(res.data);
        setOpenId(res.data[0]?.id ?? null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
            Pathology &amp; Biomarkers
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">
            Laboratory Reports
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#d5d2c9] bg-white text-xs font-medium text-[#14181a] hover:border-[#14181a]"
        >
          <Printer className="h-3.5 w-3.5" />
          Print Reports
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          Loading laboratory reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          No laboratory reports available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isOpen = openId === report.id;
            return (
              <article
                key={report.id}
                className="rounded-2xl border border-[#e6e4dd] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : report.id)}
                  className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <span className="h-10 w-10 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center shrink-0">
                      <FlaskConical className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#768086]">
                        <span>{report.report_code}</span>
                        <span>·</span>
                        <span className="text-[#0f5c5c]">{report.category}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-[#14181a] mt-0.5">
                        {report.test_name}
                      </h2>
                      <p className="text-xs text-[#4b555b] mt-0.5">
                        Ordered by {report.ordered_by}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="sm:text-right">
                      <p className="inline-flex items-center gap-1 text-xs font-mono text-[#14181a]">
                        <Calendar className="h-3.5 w-3.5 text-[#0f5c5c]" />
                        {report.collected_date}
                      </p>
                      <p className="text-[11px] font-mono text-[#0f5c5c] mt-0.5">{report.status}</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#768086] transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#e6e4dd] space-y-5">
                    <p className="text-sm text-[#4b555b] bg-[#faf9f6] rounded-xl p-4 border border-[#e6e4dd]">
                      <strong className="text-[#14181a]">Clinical Summary:</strong> {report.summary}
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#e6e4dd] text-[11px] font-mono uppercase tracking-wider text-[#768086]">
                            <th className="py-2.5 pr-4">Parameter</th>
                            <th className="py-2.5 pr-4">Result</th>
                            <th className="py-2.5 pr-4">Reference Range</th>
                            <th className="py-2.5 text-right">Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e4dd]/70">
                          {report.results_json.map((row) => (
                            <tr key={row.parameter}>
                              <td className="py-3 pr-4 font-medium text-[#14181a]">
                                {row.parameter}
                              </td>
                              <td className="py-3 pr-4 font-mono text-[#14181a]">
                                {row.value}{' '}
                                <span className="text-xs text-[#768086]">{row.unit}</span>
                              </td>
                              <td className="py-3 pr-4 font-mono text-xs text-[#4b555b]">
                                {row.reference}
                              </td>
                              <td className="py-3 text-right">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#edf5f4] text-[#0f5c5c] text-[11px] font-mono">
                                  {row.flag}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

