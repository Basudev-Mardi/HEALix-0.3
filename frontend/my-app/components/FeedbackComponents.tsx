'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Info,
  Loader2,
  X,
} from 'lucide-react';

// 1. Page Loader
export interface PageLoaderProps {
  label?: string;
  sublabel?: string;
  fullscreen?: boolean;
}

export function PageLoader({
  label = 'Loading medical records...',
  sublabel = 'Connecting to Healix Clinical Gateway',
  fullscreen = false,
}: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-[#174C40] animate-spin" />
        <span className="absolute h-3 w-3 rounded-full bg-[#287A64] animate-ping" />
      </div>
      <div>
        <p className="font-heading text-sm font-semibold text-[#242A28]">{label}</p>
        {sublabel && <p className="text-xs text-[#77817C] mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAFAF7]/80 backdrop-blur-xs">
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 shadow-lg">
          {content}
        </div>
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{content}</div>;
}

// 2. Error Display State
export interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'banner' | 'card' | 'inline';
}

export function ErrorDisplay({
  title = 'Encountered a problem',
  message,
  onRetry,
  variant = 'card',
}: ErrorDisplayProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-xs text-[#b91c1c] p-2 rounded-lg bg-[#FEF2F2] border border-[#f0d5d5]">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto font-medium underline hover:text-black"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 sm:p-7 text-left space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading text-sm font-bold text-rose-900">{title}</h3>
          <p className="text-xs text-rose-800 leading-relaxed mt-1">{message}</p>
        </div>
      </div>
      {onRetry && (
        <div className="pt-2 pl-12">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// 3. Empty Display State
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#E5E8E6] bg-white p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
      <div className="h-12 w-12 rounded-2xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center mb-1">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold text-[#242A28]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#77817C] max-w-sm leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 btn-secondary text-xs h-9"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// 4. Notification Toast
export interface ToastNotificationProps {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export function ToastNotification({
  type = 'success',
  title,
  message,
  onClose,
}: ToastNotificationProps) {
  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="h-4 w-4 text-rose-700" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-4 w-4 text-amber-700" />,
    },
    info: {
      bg: 'bg-teal-50 border-teal-200 text-teal-900',
      icon: <Info className="h-4 w-4 text-teal-700" />,
    },
  }[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-md ${config.bg} transition-all max-w-md w-full`}
      role="alert"
    >
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="flex-1 text-xs">
        {title && <p className="font-semibold text-xs leading-none mb-1">{title}</p>}
        <p className="leading-relaxed opacity-90">{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// 5. Confirmation Modal
export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-[#E5E8E6] bg-white p-6 shadow-xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-2">
          <h3 className="font-heading text-lg font-bold text-[#242A28]">{title}</h3>
          <p className="text-xs sm:text-sm text-[#4A5350] leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E8E6]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-4 py-2 rounded-lg border border-[#E5E8E6] text-xs font-medium text-[#242A28] hover:bg-[#FAFAF7] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5 ${
              variant === 'danger'
                ? 'bg-[#b91c1c] hover:bg-rose-800'
                : 'bg-[#174C40] hover:bg-[#123C32]'
            }`}
          >
            {isConfirming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
