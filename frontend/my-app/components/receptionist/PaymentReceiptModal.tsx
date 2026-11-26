'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  User,
  Phone,
  Stethoscope,
  ShieldCheck,
  Receipt,
  QrCode,
} from 'lucide-react';

export interface ReceiptData {
  receipt_number: string;
  payment_id: string;
  visit_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_gender?: string;
  patient_address?: string;
  fee_type: string;
  amount: number | string;
  payment_method: string;
  payment_status: string;
  transaction_reference?: string;
  received_by?: string;
  payment_date?: string;
  created_at?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  room_or_cabin?: string;
  department_name?: string;
  token_display?: string;
  notes?: string;
}

interface PaymentReceiptModalProps {
  receipt: ReceiptData;
  onClose: () => void;
}

export default function PaymentReceiptModal({ receipt, onClose }: PaymentReceiptModalProps) {
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.payment_date || receipt.created_at
    ? new Date(receipt.payment_date || receipt.created_at!).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const numAmount = Number(receipt.amount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-[#E5E8E6] shadow-2xl overflow-hidden my-6">
        {/* Modal Toolbar (hidden during print) */}
        <div className="print:hidden p-4 bg-[#FAFAF7] border-b border-[#E5E8E6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Receipt className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-[#1F2421]">Official Payment Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#77817C] hover:text-[#1F2421] hover:bg-slate-200/50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={receiptPrintRef} className="p-6 sm:p-8 space-y-6 text-[#1F2421] bg-white print:p-0">
          {/* Hospital Header */}
          <div className="text-center pb-5 border-b border-dashed border-[#CBD5E1] space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="h-6 w-6 rounded-full border border-[#174C40] text-[#174C40] flex items-center justify-center text-[10px] font-mono font-bold">
                Hx
              </span>
              <h1 className="font-serif text-lg font-bold tracking-tight text-[#174C40] uppercase">
                Healix Medical Center
              </h1>
            </div>
            <p className="text-[11px] text-[#4A5350]">Quaternary Clinical Care &amp; Hospital Network</p>
            <p className="text-[10px] text-[#77817C] font-mono">
              480 Meridian Avenue, Boston, MA 02115 • Tel: +1 (800) 432-5490
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold tracking-wider uppercase">
                Payment Receipt • {receipt.payment_status}
              </span>
            </div>
          </div>

          {/* Receipt & Encounter Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono pb-4 border-b border-[#F0F2F0]">
            <div>
              <span className="text-[10px] text-[#77817C] uppercase block">Receipt Number</span>
              <span className="font-bold text-[#174C40] text-sm">{receipt.receipt_number}</span>
              <span className="text-[10px] text-[#77817C] block mt-1">Date: {formattedDate}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#77817C] uppercase block">Visit Reference</span>
              <span className="font-bold text-[#1F2421]">{receipt.visit_id}</span>
              {receipt.token_display && (
                <span className="text-[11px] font-bold text-[#174C40] bg-[#E6EFE9] px-2 py-0.5 rounded block mt-1 ml-auto w-fit">
                  Token: {receipt.token_display}
                </span>
              )}
            </div>
          </div>

          {/* Patient Details */}
          <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs space-y-1">
            <span className="text-[10px] font-mono text-[#77817C] uppercase font-bold block mb-1">
              Patient Identification
            </span>
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#1F2421] text-sm">{receipt.patient_name}</span>
              <span className="font-mono text-[#174C40] font-semibold">{receipt.patient_id}</span>
            </div>
            <div className="flex justify-between text-[#4A5350] text-[11px] pt-1">
              <span>Mobile: {receipt.patient_phone || 'N/A'}</span>
              <span>Gender: {receipt.patient_gender || 'Other'}</span>
            </div>
            {receipt.patient_address && (
              <div className="text-[10px] text-[#77817C] pt-0.5">{receipt.patient_address}</div>
            )}
          </div>

          {/* Clinical Service Details */}
          <div className="text-xs space-y-1 px-1">
            <div className="flex justify-between py-1 border-b border-[#F0F2F0]">
              <span className="text-[#77817C]">Department:</span>
              <span className="font-semibold text-[#1F2421]">{receipt.department_name || 'Central OPD'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0F2F0]">
              <span className="text-[#77817C]">Consulting Physician:</span>
              <span className="font-semibold text-[#1F2421]">
                Dr. {receipt.doctor_name || 'Staff Physician'}
                {receipt.room_or_cabin && ` (${receipt.room_or_cabin})`}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0F2F0]">
              <span className="text-[#77817C]">Payment Method:</span>
              <span className="font-semibold text-[#1F2421] font-mono">
                {receipt.payment_method}
                {receipt.transaction_reference && ` (Ref: ${receipt.transaction_reference})`}
              </span>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="space-y-2">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#CBD5E1] text-[10px] font-mono text-[#77817C] uppercase">
                  <th className="py-1.5">Description</th>
                  <th className="py-1.5 text-center">Qty</th>
                  <th className="py-1.5 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F0]">
                <tr>
                  <td className="py-2.5 font-medium">{receipt.fee_type}</td>
                  <td className="py-2.5 text-center font-mono">1</td>
                  <td className="py-2.5 text-right font-mono font-semibold">${numAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Total Summary */}
            <div className="pt-3 border-t border-[#CBD5E1] flex justify-between items-center text-sm font-bold">
              <span>Total Paid:</span>
              <span className="font-mono text-base text-[#174C40]">${numAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer & Cashier Auth */}
          <div className="pt-6 border-t border-dashed border-[#CBD5E1] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#77817C]">
            <div>
              <p>Cashier / Reception Desk: <strong>{receipt.received_by || 'Hospital Staff'}</strong></p>
              <p className="font-mono text-[9px] mt-0.5">Computer-generated receipt • Valid proof of payment</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                Verified &amp; Settled
              </span>
            </div>
          </div>
        </div>

        {/* Modal Close Footer */}
        <div className="print:hidden p-4 bg-[#FAFAF7] border-t border-[#E5E8E6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-[#E5E8E6] text-xs font-semibold text-[#1F2421] hover:bg-slate-50 cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
