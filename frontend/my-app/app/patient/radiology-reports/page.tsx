'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Printer,
  ScanLine,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { getStoredPatient, patientApiFetch, type PatientUser, type RadiologyReportItem } from '@/lib/patient-auth';

export default function RadiologyReportsPage() {
  const [studies, setStudies] = useState<RadiologyReportItem[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientUser | null>(null);

  useEffect(() => {
    setPatient(getStoredPatient());
    patientApiFetch<RadiologyReportItem[]>('/patient/radiology-reports').then((res) => {
      if (res.data) setStudies(res.data);
      setLoading(false);
    });
  }, []);

  const modalities = useMemo(() => {
    const set = new Set<string>();
    studies.forEach((s) => set.add(s.modality));
    return ['All', ...Array.from(set)];
  }, [studies]);

  const filteredStudies = useMemo(() => {
    return studies.filter((s) => {
      const matchMod = selectedModality === 'All' || s.modality === selectedModality;
      const matchSearch =
        searchQuery.trim() === '' ||
        s.study_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.study_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.radiologist_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMod && matchSearch;
    });
  }, [studies, selectedModality, searchQuery]);

  function handleDownloadRadiologyReport(study: RadiologyReportItem) {
    const separator = '='.repeat(72);
    const line = '-'.repeat(72);
    const content = [
      separator,
      'HEALIX MEDICAL CENTER · ADVANCED DIAGNOSTIC IMAGING CORE',
      '480 Meridian Avenue, Boston, MA 02116 | ACR Accredited Comprehensive Imaging',
      separator,
      '',
      'OFFICIAL RADIOLOGY CONSULTATION REPORT · VERIFIED CLINICAL RELEASE',
      line,
      `Study Accession Code  : ${study.study_code}`,
      `Imaging Modality      : ${study.modality}`,
      `Examination Date      : ${study.study_date}`,
      `Interpreting Radiologist: ${study.radiologist_name}`,
      `Clinical Status       : ${study.status} (Released to Patient Electronic File)`,
      line,
      'PATIENT IDENTIFICATION',
      `Patient Name          : ${patient?.full_name || 'Patient'}`,
      `Medical Record Number : ${patient?.mrn || 'HX-MRN-402819'}`,
      `Date of Birth         : ${patient?.date_of_birth || 'N/A'}`,
      `Biological Gender     : ${patient?.gender || 'N/A'}`,
      line,
      '',
      `EXAMINATION PROTOCOL: ${study.study_name.toUpperCase()}`,
      '',
      'DETAILED RADIOLOGICAL FINDINGS:',
      study.findings,
      '',
      line,
      'IMPRESSION & CLINICAL CONCLUSION:',
      study.impression,
      '',
      line,
      'ELECTRONIC VALIDATION & PHYSICIAN ATTESTATION:',
      `Interpreted and Signed by: ${study.radiologist_name}`,
      `Electronic Release Date   : ${study.study_date} (Released via Healix PACS / RIS)`,
      'Medical Legal Notice      : Confidential Electronic Health Record (HIPAA PHI).',
      separator,
    ].join('\r\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Healix-RadiologyReport-${study.study_code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
            Diagnostic Imaging &amp; PACS
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">
            Radiology Reports
          </h1>
          <p className="text-xs text-[#768086] mt-1">
            Diagnostic imaging interpretations verified and finalized by board-certified radiologists.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#d5d2c9] bg-white text-xs font-semibold text-[#14181a] hover:border-[#14181a] transition-colors"
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
              ACR Accredited Diagnostic Imaging Releases
            </span>
            <span className="text-emerald-800 text-[11px]">
              Reports are finalized by subspecialty radiologists and released directly from our high-bandwidth clinical PACS server.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full shrink-0">
          ACR Accredited · HIPAA PHI
        </span>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {modalities.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => setSelectedModality(mod)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedModality === mod
                  ? 'bg-[#14181a] text-white'
                  : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="h-3.5 w-3.5 text-[#768086] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study name, modality, doctor..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white border border-[#e6e4dd] text-xs text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          Loading authorized imaging studies...
        </div>
      ) : filteredStudies.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-center space-y-2">
          <p className="text-base font-medium text-[#14181a]">No radiology reports match your filter.</p>
          <p className="text-xs text-[#768086]">Studies are visible once finalized and released by your radiologist.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredStudies.map((study) => (
            <article
              key={study.id}
              className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#e6e4dd]">
                <div className="flex items-start gap-4">
                  <span className="h-10 w-10 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center shrink-0">
                    <ScanLine className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="font-semibold text-[#14181a]">{study.study_code}</span>
                      <span>·</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#edf5f4] text-[#0f5c5c] font-medium">
                        {study.modality}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        {study.status}
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl text-[#14181a] mt-1">
                      {study.study_name}
                    </h2>
                  </div>
                </div>

                <div className="sm:text-right text-xs font-mono">
                  <p className="inline-flex items-center gap-1 text-[#14181a]">
                    <Calendar className="h-3.5 w-3.5 text-[#0f5c5c]" />
                    {study.study_date}
                  </p>
                  <p className="text-[11px] text-[#0f5c5c] mt-0.5 font-medium">Authorized Release</p>
                </div>
              </div>

              {/* Findings & Radiologist Impression */}
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#768086] mb-1 font-semibold">
                    Radiological Findings
                  </p>
                  <p className="leading-relaxed text-[#4b555b] bg-[#faf9f6] p-4 rounded-xl border border-[#e6e4dd]">
                    {study.findings}
                  </p>
                </div>

                <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4]/60 p-4 space-y-1">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c] font-semibold">
                    Radiologist Impression &amp; Clinical Conclusion
                  </p>
                  <p className="font-medium text-[#14181a] leading-relaxed">{study.impression}</p>
                </div>
              </div>

              {/* Action Toolbar & Radiologist Signoff */}
              <div className="pt-4 border-t border-[#e6e4dd] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <p className="text-[#768086] inline-flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-[#0f5c5c]" />
                  <span>
                    Interpreted &amp; electronically signed by <strong>{study.radiologist_name}</strong>
                  </span>
                </p>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleDownloadRadiologyReport(study)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#14181a] text-white font-medium hover:bg-[#0f5c5c] transition-colors shadow-sm text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Summary (.txt)
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#d5d2c9] text-[#14181a] font-medium hover:border-[#14181a] transition-colors text-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
