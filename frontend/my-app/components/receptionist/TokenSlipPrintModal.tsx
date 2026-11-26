'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Stethoscope,
  Activity,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

export interface GeneratedTokenData {
  visit: {
    visit_id: string;
    visit_date: string;
    visit_type: string;
    status: string;
  };
  token: {
    token_id: string;
    token_number: number;
    token_display: string;
    queue_date: string;
    status: string;
    priority?: string;
    waiting_ahead?: number;
    estimated_wait_mins?: number;
    created_at?: string;
  };
  patient: {
    patient_id: string;
    patient_number?: string;
    full_name: string;
    dob?: string;
    age?: {
      formatted: string;
    } | null;
    gender: string;
    mobile: string;
    blood_group?: string;
  };
  department: {
    id: number;
    name: string;
    prefix: string;
  };
  doctor: {
    id: number;
    name: string;
    cabin: string;
  };
}

interface TokenSlipPrintModalProps {
  data: GeneratedTokenData;
  onClose: () => void;
}

export default function TokenSlipPrintModal({
  data,
  onClose,
}: TokenSlipPrintModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const payload = JSON.stringify({
      system: 'HEALIX-HMS',
      token_id: data.token.token_id,
      token: data.token.token_display,
      patient_id: data.patient.patient_id,
      department: data.department.name,
      doctor: data.doctor.name,
      cabin: data.doctor.cabin,
      verify: `https://healix.hospital/verify/token?id=${encodeURIComponent(data.token.token_id)}`,
    });
    QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: { dark: '#174C40', light: '#FAFAF7' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate token QR', err));
  }, [data]);

  const handlePrint = () => {
    window.print();
  };

  const formattedTime = new Date(
    data.token.created_at || new Date()
  ).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDate = new Date(
    data.token.queue_date || new Date()
  ).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Print-specific style block */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-token-slip,
          #printable-token-slip * {
            visibility: visible;
          }
          #printable-token-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 380px;
            margin: 0 auto;
            border: none !important;
            box-shadow: none !important;
            padding: 10px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-md rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 p-2 rounded-xl text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Printable Ticket Area */}
        <div
          id="printable-token-slip"
          className="rounded-2xl border-2 border-dashed border-[#174C40]/30 bg-[#FAFAF7] p-5 sm:p-6 space-y-5 text-center text-[#1F2421]"
        >
          {/* Hospital Header */}
          <div className="space-y-1 pb-3 border-b border-[#E5E8E6]">
            <div className="text-[11px] font-mono tracking-widest uppercase font-bold text-[#174C40]">
              HEALIX CENTRAL HOSPITAL
            </div>
            <div className="text-xs font-semibold text-[#1F2421]">
              Central OPD &amp; Emergency Intake
            </div>
            <div className="text-[10px] text-[#77817C] font-mono">
              Patient Queue Consultation Slip
            </div>
          </div>

          {/* Department & Cabin Badge */}
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-emerald-100 text-[#174C40] border border-emerald-200">
              {data.department.name}
            </span>
            <div className="text-xs text-[#77817C]">
              Room: <strong className="text-[#1F2421]">{data.doctor.cabin}</strong>
            </div>
          </div>

          {/* Giant Prominent Token Badge */}
          <div className="py-2">
            <div className="text-[11px] font-mono text-[#77817C] uppercase tracking-wider">
              YOUR QUEUE TOKEN
            </div>
            <div className="text-5xl font-mono font-bold text-[#174C40] tracking-tight py-1">
              {data.token.token_display}
            </div>
            <div className="text-xs font-medium text-[#4A5350]">
              Consulting: <strong className="text-[#1F2421]">{data.doctor.name}</strong>
            </div>
          </div>

          {/* Queue Wait Status Strip */}
          <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-white border border-[#E5E8E6] text-xs">
            <div>
              <span className="text-[10px] font-mono text-[#77817C] block uppercase">Waiting Ahead</span>
              <span className="font-bold text-[#174C40] text-sm">
                {data.token.waiting_ahead ?? 0} Patient{(data.token.waiting_ahead ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#77817C] block uppercase">Est. Wait Time</span>
              <span className="font-bold text-amber-700 text-sm">
                ~{data.token.estimated_wait_mins ?? 0} mins
              </span>
            </div>
          </div>

          {/* Patient Summary */}
          <div className="text-left text-xs space-y-1.5 pt-2 border-t border-[#E5E8E6]">
            <div className="flex justify-between">
              <span className="text-[#77817C]">Patient:</span>
              <span className="font-semibold text-[#1F2421]">{data.patient.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77817C]">Patient ID:</span>
              <span className="font-mono text-[#174C40] font-semibold">{data.patient.patient_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77817C]">Age / Gender:</span>
              <span>
                {data.patient.age?.formatted || 'DOB on file'} • {data.patient.gender}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77817C]">Visit Type:</span>
              <span className="font-mono font-medium">{data.visit.visit_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77817C]">Issued Date &amp; Time:</span>
              <span className="font-mono text-[11px]">
                {formattedDate} {formattedTime}
              </span>
            </div>
          </div>

          {/* QR Code & Barcode Notice */}
          <div className="pt-3 border-t border-[#E5E8E6] space-y-2 text-center">
            {qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR for ${data.token.token_display}`}
                  className="w-24 h-24 object-contain rounded-lg border border-[#E5E8E6] bg-white p-1"
                />
              </div>
            )}
            <div className="font-mono text-xs tracking-widest text-[#77817C]">
              *{data.token.token_id.slice(-14)}*
            </div>
            <p className="text-[10px] text-[#77817C] leading-snug">
              Please proceed to waiting lounge. Watch the OPD display screen for your token call.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
          >
            Close &amp; Back to Dashboard
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Token Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
