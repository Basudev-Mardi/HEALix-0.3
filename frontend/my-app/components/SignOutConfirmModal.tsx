'use client';

import React from 'react';
import { AlertCircle, LogOut, X } from 'lucide-react';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function SignOutConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Are you sure you want to sign out?',
  message = 'If you go back, you will leave your current staff session and return to the staff login page. Are you sure you want to continue?',
}: SignOutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242A28]/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E8E6] p-6 sm:p-8 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
          className="absolute top-5 right-5 text-[#77817C] hover:text-[#242A28] p-1.5 rounded-full hover:bg-[#FAFAF7] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-rose-600" />
        </div>

        <div>
          <h2
            id="sign-out-dialog-title"
            className="font-editorial text-2xl font-medium text-[#242A28] tracking-tight"
          >
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5350] mt-2 leading-relaxed font-light">
            {message}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-xs font-semibold text-[#242A28] transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
          >
            <LogOut className="h-4 w-4" />
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
