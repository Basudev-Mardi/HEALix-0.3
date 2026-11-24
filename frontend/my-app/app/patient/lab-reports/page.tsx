'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  FileText,
  Filter,
  FlaskConical,
  Printer,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { getStoredPatient, patientApiFetch, type LabReportItem, type PatientUser } from '@/lib/patient-auth';

export default function LabReportsPage() {
  const [reports, setReports] = useState<LabReportItem[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientUser | null>(null);

  useEffect(() => {
    setPatient(getStoredPatient());
    patientApiFetch<LabReportItem[]>('/patient/lab-reports').then((res) => {
      if (res.data) {
        setReports(res.data);
        setOpenId(res.data[0]?.id ?? null);
      }
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => set.add(r.category));
    return ['All', ...Array.from(set)];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchCat = selectedCategory === 'All' || r.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        r.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.report_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ordered_by.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [reports, selectedCategory, searchQuery]);

  function handleDownloadLabReport(report: LabReportItem) {
    const separator = '='.repeat(72);
    const line = '-'.repeat(72);
    const content = [
      separator,
      'HEALIX MEDICAL CENTER · AUTOMATED PATHOLOGY & BIOMARKER CORE',
      '480 Meridian Avenue, Boston, MA 02116 | Accredited: CAP #892014 & CLIA #22D091',
      separator,
      '',
      'OFFICIAL LABORATORY DIAGNOSTIC REPORT · VERIFIED CLINICAL RELEASE',
      line,
      `Report Accession Code : ${report.report_code}`,
      `Specimen Collected    : ${report.collected_date}`,
      `Ordering Physician    : ${report.ordered_by}`,
      `Pathology Category    : ${report.category}`,
      `Verification Status   : ${report.status} (Eligible for Patient Release)`,
      line,
      'PATIENT IDENTIFICATION',
      `Patient Name          : ${patient?.full_name || 'Patient'}`,
      `Medical Record Number : ${patient?.mrn || 'HX-MRN-402819'}`,
      `Date of Birth         : ${patient?.date_of_birth || 'N/A'}`,
      `Biological Gender     : ${patient?.gender || 'N/A'}`,
      line,
      '',
      `TEST PERFORMED: ${report.test_name.toUpperCase()}`,
      '',
      'BIOMARKER RESULTS MATRIX:',
      'Parameter                   Value          Units    Reference Range    Flag',
      line,
      ...report.results_json.map((row) => {
        const p = row.parameter.padEnd(28, ' ');
        const v = row.value.padEnd(14, ' ');
        const u = row.unit.padEnd(9, ' ');
        const r = row.reference.padEnd(19, ' ');
        return `${p}${v}${u}${r}${row.flag}`;
      }),
      line,
      '',
      'PATHOLOGIST CLINICAL INTERPRETATION:',
      report.summary,
      '',
      line,
      'ELECTRONIC SIGNATURE & VALIDATION:',
      `Authorized & Released by: ${report.ordered_by}, MD, FCAP`,
      `Electronic Release Date : ${report.collected_date} (Released via Healix LIMS)`,
      'Confidentiality Notice  : HIPAA Protected Health Information (PHI).',
      separator,
    ].join('\r\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Healix-LabReport-${report.report_code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40]">
            Pathology &amp; Biomarkers
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#242A28] mt-1">
            Laboratory Reports
          </h1>
          <p className="text-xs text-[#77817C] mt-1">
            Authorized diagnostic releases verified by board-certified pathologists.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#77817C] bg-white text-xs font-semibold text-[#242A28] hover:border-[#242A28] transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Reports
          </button>
        </div>
      </div>

      {/* Hospital Regulatory Release Disclosure */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-900 block">
              Authorized Clinical Release Standard
            </span>
            <span className="text-emerald-800 text-[11px]">
              Every report shown below has undergone two-tier clinical review, pathologist signoff, and official release under CAP &amp; CLIA compliance.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full shrink-0">
          CAP #892014 · CLIA Validated
        </span>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#242A28] text-white'
                  : 'bg-white border border-[#E5E8E6] text-[#4A5350] hover:border-[#242A28]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="h-3.5 w-3.5 text-[#77817C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test name or code..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white border border-[#E5E8E6] text-xs text-[#242A28] focus:outline-none focus:border-[#174C40]"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
          Loading verified laboratory reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-center space-y-2">
          <p className="text-base font-medium text-[#242A28]">No laboratory reports match your filter.</p>
          <p className="text-xs text-[#77817C]">Only clinical reports approved and released by your physician appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isOpen = openId === report.id;
            return (
              <article
                key={report.id}
                className="rounded-2xl border border-[#E5E8E6] bg-white overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : report.id)}
                  className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left hover:bg-[#FAFAF7]/60 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="h-10 w-10 rounded-xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center shrink-0">
                      <FlaskConical className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#77817C]">
                        <span className="font-semibold text-[#242A28]">{report.report_code}</span>
                        <span>·</span>
                        <span className="text-[#174C40] font-medium">{report.category}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          {report.status}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-[#242A28] mt-0.5">
                        {report.test_name}
                      </h2>
                      <p className="text-xs text-[#4A5350] mt-0.5">
                        Supervised &amp; Signed by <strong className="text-[#242A28]">{report.ordered_by}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="sm:text-right">
                      <p className="inline-flex items-center gap-1 text-xs font-mono text-[#242A28]">
                        <Calendar className="h-3.5 w-3.5 text-[#174C40]" />
                        {report.collected_date}
                      </p>
                      <p className="text-[11px] font-mono text-[#174C40] mt-0.5">Authorized Release</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#77817C] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#E5E8E6] space-y-5">
                    {/* Clinical Summary */}
                    <div className="text-xs sm:text-sm text-[#4A5350] bg-[#FAFAF7] rounded-xl p-4 border border-[#E5E8E6] space-y-1">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] font-semibold">
                        Pathologist Interpretive Summary:
                      </p>
                      <p className="text-[#242A28] leading-relaxed italic">{report.summary}</p>
                    </div>

                    {/* Biomarker Matrix Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E8E6] text-[11px] font-mono uppercase tracking-wider text-[#77817C]">
                            <th className="py-2.5 pr-4">Biomarker Parameter</th>
                            <th className="py-2.5 pr-4">Observed Value</th>
                            <th className="py-2.5 pr-4">Biological Reference Range</th>
                            <th className="py-2.5 text-right">Clinical Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E8E6]/70">
                          {report.results_json.map((row) => (
                            <tr key={row.parameter}>
                              <td className="py-3 pr-4 font-medium text-[#242A28]">
                                {row.parameter}
                              </td>
                              <td className="py-3 pr-4 font-mono font-semibold text-[#242A28]">
                                {row.value}{' '}
                                <span className="text-xs font-normal text-[#77817C]">{row.unit}</span>
                              </td>
                              <td className="py-3 pr-4 font-mono text-xs text-[#4A5350]">
                                {row.reference}
                              </td>
                              <td className="py-3 text-right">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                                    row.flag === 'Optimal' || row.flag === 'Normal'
                                      ? 'bg-[#E6EFE9] text-[#174C40]'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {row.flag}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Toolbar & Pathologist Signoff */}
                    <div className="pt-4 border-t border-[#E5E8E6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2 text-[#77817C]">
                        <FileCheck2 className="h-4 w-4 text-[#174C40]" />
                        <span>
                          Electronic validation completed by <strong>{report.ordered_by}</strong> on {report.collected_date}.
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleDownloadLabReport(report)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242A28] text-white font-medium hover:bg-[#174C40] transition-colors shadow-sm text-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download Report (.txt)
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#77817C] text-[#242A28] font-medium hover:border-[#242A28] transition-colors text-xs"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </button>
                      </div>
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
