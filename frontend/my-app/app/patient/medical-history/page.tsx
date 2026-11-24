'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Stethoscope } from 'lucide-react';
import { patientApiFetch, type MedicalHistoryItem } from '@/lib/patient-auth';

export default function MedicalHistoryPage() {
  const [records, setRecords] = useState<MedicalHistoryItem[]>([]);
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApiFetch<MedicalHistoryItem[]>('/patient/medical-history').then((res) => {
      if (res.data) setRecords(res.data);
      setLoading(false);
    });
  }, []);

  const types = useMemo(
    () => ['All', ...Array.from(new Set(records.map((r) => r.record_type)))],
    [records]
  );

  const filtered =
    selectedType === 'All'
      ? records
      : records.filter((r) => r.record_type === selectedType);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40]">
          Clinical Timeline
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#242A28] mt-1">Medical History</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedType(t)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${selectedType === t
              ? 'bg-[#242A28] text-white'
              : 'bg-white border border-[#E5E8E6] text-[#4A5350] hover:border-[#242A28]'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
          Loading clinical history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
          No medical history records documented yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[#E5E8E6] bg-white p-6 sm:p-7 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40] text-[11px] font-mono uppercase tracking-wider">
                    {item.record_type}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#E6EFE9] text-[#4A5350] text-[11px] font-mono">
                    {item.status}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#77817C]">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.recorded_date}
                </span>
              </div>

              <h2 className="font-editorial text-2xl text-[#242A28]">{item.title}</h2>
              <p className="text-sm leading-relaxed text-[#4A5350]">{item.summary}</p>

              <p className="pt-3 border-t border-[#E5E8E6] text-xs text-[#77817C] inline-flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-[#174C40]" />
                {item.doctor_name} · {item.department_name}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

