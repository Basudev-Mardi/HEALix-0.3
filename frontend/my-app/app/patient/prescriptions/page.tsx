'use client';

import { useEffect, useState } from 'react';
import { Calendar, Pill, RefreshCw, Stethoscope } from 'lucide-react';
import { patientApiFetch, type PrescriptionItem } from '@/lib/patient-auth';

export default function PrescriptionsPage() {
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApiFetch<PrescriptionItem[]>('/patient/prescriptions').then((res) => {
      if (res.data) setItems(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
          Medications &amp; Refills
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">Prescriptions</h1>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          Loading prescriptions...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          No prescriptions on file.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((rx) => (
            <article
              key={rx.id}
              className="rounded-2xl border border-[#e6e4dd] bg-white p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="h-9 w-9 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center">
                    <Pill className="h-4 w-4" />
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-mono ${
                      rx.status === 'Active'
                        ? 'bg-[#edf5f4] text-[#0f5c5c]'
                        : 'bg-[#f2f1ec] text-[#768086]'
                    }`}
                  >
                    {rx.status}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[#14181a]">{rx.medication_name}</h2>
                  <p className="text-xs font-mono text-[#0f5c5c] mt-0.5">
                    {rx.dosage} · {rx.frequency}
                  </p>
                </div>

                <p className="text-sm text-[#4b555b] leading-relaxed">{rx.instructions}</p>
              </div>

              <div className="pt-4 border-t border-[#e6e4dd] space-y-2 text-xs text-[#768086]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-[#0f5c5c]" />
                    {rx.prescribed_by}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Calendar className="h-3.5 w-3.5" />
                    {rx.prescribed_date}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#14181a]">
                  <span>Duration: {rx.duration}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[#0f5c5c]">
                    <RefreshCw className="h-3 w-3" />
                    {rx.refills_remaining} refills left
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
