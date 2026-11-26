'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  QrCode,
  ShieldCheck,
  User,
  Phone,
  Droplet,
  Copy,
  Check,
} from 'lucide-react';

export interface PatientQRData {
  patient_id: string;
  patient_number?: string;
  full_name: string;
  dob?: string;
  gender: string;
  mobile: string;
  blood_group?: string;
  emergency_contact?: string;
}

interface PatientQRCodeModalProps {
  patient: PatientQRData;
  onClose: () => void;
}

export default function PatientQRCodeModal({
  patient,
  onClose,
}: PatientQRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // The QR payload includes verified patient identification data
  const qrPayload = JSON.stringify({
    system: 'HEALIX-HMS',
    patient_id: patient.patient_id,
    name: patient.full_name,
    mobile: patient.mobile,
    gender: patient.gender,
    blood_group: patient.blood_group || 'N/A',
    emergency_contact: patient.emergency_contact || 'N/A',
    verify_url: `https://healix.hospital/verify/pat?id=${encodeURIComponent(
      patient.patient_id
    )}`,
  });

  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#174C40',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [qrPayload]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(patient.patient_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-card,
          #printable-qr-card * {
            visibility: visible;
          }
          #printable-qr-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 380px;
            margin: 0 auto;
            border: 1px solid #174c40 !important;
            box-shadow: none !important;
            padding: 16px !important;
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

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-[#174C40]/10 text-[#174C40] border border-[#174C40]/20">
            <QrCode className="h-3.5 w-3.5" />
            Patient Digital Identity
          </div>
          <h2 className="text-xl font-serif text-[#1F2421] tracking-tight">
            Universal QR Identifier
          </h2>
          <p className="text-xs text-[#77817C]">
            Scan at kiosk, reception desk, or nursing bay for instant chart retrieval.
          </p>
        </div>

        {/* Printable Card Area */}
        <div
          id="printable-qr-card"
          className="rounded-2xl border-2 border-[#174C40]/20 bg-[#FAFAF7] p-5 space-y-4 text-center text-[#1F2421]"
        >
          {/* Card Hospital Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E6]">
            <div className="text-left">
              <div className="text-xs font-bold font-mono tracking-wider text-[#174C40] uppercase">
                HEALIX MEDICAL
              </div>
              <div className="text-[10px] text-[#77817C]">
                Official Patient Identification Card
              </div>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#174C40]" />
          </div>

          {/* QR Code Container */}
          <div className="flex justify-center py-2">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl border border-[#E5E8E6] shadow-xs inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${patient.full_name}`}
                  className="w-52 h-52 object-contain"
                />
              </div>
            ) : (
              <div className="w-52 h-52 flex items-center justify-center bg-white rounded-2xl border border-[#E5E8E6] text-xs text-[#77817C]">
                Generating QR...
              </div>
            )}
          </div>

          {/* Patient Details */}
          <div className="space-y-1 pt-1">
            <h3 className="text-lg font-serif font-bold text-[#1F2421]">
              {patient.full_name}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xs font-bold text-[#174C40] bg-[#174C40]/10 px-2 py-0.5 rounded-md">
                {patient.patient_id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Patient ID"
                className="no-print p-1 rounded-md text-[#77817C] hover:text-[#1F2421] hover:bg-[#E5E8E6] transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-2 gap-2 text-left text-xs bg-white p-3 rounded-xl border border-[#E5E8E6]">
            <div>
              <span className="text-[10px] font-mono text-[#77817C] block uppercase">
                Gender / Blood
              </span>
              <span className="font-medium text-[#1F2421]">
                {patient.gender} • {patient.blood_group || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#77817C] block uppercase">
                Mobile
              </span>
              <span className="font-mono text-[11px] text-[#1F2421]">
                {patient.mobile || 'None on file'}
              </span>
            </div>
            {patient.emergency_contact && (
              <div className="col-span-2 pt-1 border-t border-[#F0F2F0]">
                <span className="text-[10px] font-mono text-[#77817C] block uppercase">
                  Emergency Contact
                </span>
                <span className="text-[11px] text-[#1F2421]">
                  {patient.emergency_contact}
                </span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-[#77817C] leading-snug">
            Property of Healix Medical Center. Present at any department reception or triage station for rapid check-in.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print QR Identity Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
