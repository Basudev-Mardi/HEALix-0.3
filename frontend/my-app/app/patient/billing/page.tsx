'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { patientApiFetch, type BillingItem } from '@/lib/patient-auth';

function formatAmount(val: unknown): string {
  const num = typeof val === 'number' ? val : parseFloat(String(val ?? 0));
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

export default function BillingHistoryPage() {
  const [invoices, setInvoices] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    patientApiFetch<BillingItem[]>('/patient/billing').then((res) => {
      if (res.data) setInvoices(res.data);
      setLoading(false);
    });
  }, []);

  async function handlePay(id: number) {
    setPayingId(id);
    const res = await patientApiFetch<{ id: number; status: string; payment_method: string }>(
      `/patient/billing/${id}/pay`,
      { method: 'PATCH' }
    );
    if (res.data) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id
            ? { ...inv, status: res.data!.status, payment_method: res.data!.payment_method }
            : inv
        )
      );
    }
    setPayingId(null);
  }

  const totalDue = invoices
    .filter((i) => String(i.status).toLowerCase() !== 'paid')
    .reduce((sum, i) => sum + (Number(i.patient_responsibility) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40]">
            Statements &amp; Payments
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#242A28] mt-1">
            Billing History
          </h1>
        </div>
        <div className="rounded-xl border border-[#E5E8E6] bg-white px-5 py-3 text-right">
          <p className="text-[11px] font-mono uppercase text-[#77817C]">Balance Due</p>
          <p className="font-editorial text-2xl text-[#242A28]">${formatAmount(totalDue)}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
          Loading billing statements...
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
          No billing statements on record.
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const isPaid = String(inv.status).toLowerCase() === 'paid';
            return (
              <article
                key={inv.id}
                className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-[#77817C]">
                      {inv.invoice_number} · {inv.billing_date}
                    </p>
                    <h2 className="text-lg font-semibold text-[#242A28] mt-1">
                      {inv.service_description}
                    </h2>
                    <p className="text-xs text-[#4A5350]">{inv.department_name}</p>
                  </div>

                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-mono ${isPaid ? 'bg-[#E6EFE9] text-[#174C40]' : 'bg-[#fef2f2] text-[#b91c1c]'
                      }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E8E6] text-sm">
                  <div>
                    <p className="text-xs text-[#77817C]">Total Billed</p>
                    <p className="font-mono text-[#242A28]">${formatAmount(inv.amount_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#77817C]">Insurance Covered</p>
                    <p className="font-mono text-[#174C40]">
                      -${formatAmount(inv.insurance_covered)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#77817C]">Your Responsibility</p>
                    <p className="font-mono font-semibold text-[#242A28]">
                      ${formatAmount(inv.patient_responsibility)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E8E6] text-xs">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1.5 text-[#174C40]">
                      <CheckCircle2 className="h-4 w-4" />
                      Paid via {inv.payment_method || 'Online Portal'}
                    </span>
                  ) : (
                    <>
                      <span className="text-[#77817C]">Due by {inv.due_date}</span>
                      <button
                        type="button"
                        disabled={payingId === inv.id}
                        onClick={() => handlePay(inv.id)}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] disabled:opacity-60 transition-colors"
                      >
                        {payingId === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5" />
                        )}
                        Pay ${formatAmount(inv.patient_responsibility)}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

