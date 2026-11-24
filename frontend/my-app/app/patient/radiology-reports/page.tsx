'use client';

import { useEffect, useState } from 'react';
import { Calendar, ScanLine, Stethoscope } from 'lucide-react';
import { patientApiFetch, type RadiologyReportItem } from '@/lib/patient-auth';

export default function RadiologyReportsPage() {
  const [studies, setStudies] = useState<RadiologyReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApiFetch<RadiologyReportItem[]>('/patient/radiology-reports').then((res) => {
      if (res.data) setStudies(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
          Diagnostic Imaging
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">
          Radiology Reports
        </h1>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          Loading imaging studies...
        </div>
      ) : studies.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          No radiology studies recorded yet.
        </div>
      ) : (
        <div className="space-y-5">
          {studies.map((study) => (
            <article
              key={study.id}
              className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#e6e4dd]">
                <div className="flex items-start gap-4">
                  <span className="h-10 w-10 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center shrink-0">
                    <ScanLine className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="text-[#768086]">{study.study_code}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#edf5f4] text-[#0f5c5c]">
                        {study.modality}
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
                  <p className="text-[#0f5c5c] mt-0.5">{study.status}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#768086] mb-1">
                    Findings
                  </p>
                  <p className="leading-relaxed text-[#4b555b]">{study.findings}</p>
                </div>
                <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4]/50 p-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#0f5c5c] mb-1">
                    Radiologist Impression
                  </p>
                  <p className="font-medium text-[#14181a]">{study.impression}</p>
                </div>
              </div>

              <p className="text-xs text-[#768086] inline-flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-[#0f5c5c]" />
                Interpreted by {study.radiologist_name}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

