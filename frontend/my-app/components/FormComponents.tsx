'use client';

import React, { forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, UploadCloud } from 'lucide-react';

export interface BaseInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  successMessage?: string;
  isLoading?: boolean;
  required?: boolean;
}

// 1. Text / Email / Phone / Password / Date Input
export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseInputProps {
  type?: 'text' | 'email' | 'tel' | 'password' | 'date' | 'number';
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      successMessage,
      isLoading,
      required,
      className = '',
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-label-standard text-[#242A28] font-medium">
            {label}
            {required && <span className="text-[#b91c1c] ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={computedType}
            disabled={disabled || isLoading}
            className={`w-full form-input-standard pr-10 ${
              error ? 'form-input-error' : success ? 'border-[#287A64] bg-[#E6EFE9]/30' : ''
            } ${disabled ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : ''} ${className}`}
            {...props}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#77817C]">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-[#174C40]" />}
            {!isLoading && error && <AlertCircle className="h-4 w-4 text-[#b91c1c]" />}
            {!isLoading && success && !error && <CheckCircle2 className="h-4 w-4 text-[#287A64]" />}
            {isPassword && !isLoading && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="hover:text-[#242A28] focus:outline-none p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="form-error-message">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && success && successMessage && (
          <p className="text-xs text-[#287A64] flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{successMessage}</span>
          </p>
        )}

        {!error && (!success || !successMessage) && helperText && (
          <p className="text-xs text-[#77817C] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';

// 2. Select Input
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseInputProps {
  options: SelectOption[];
  placeholder?: string;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      isLoading,
      required,
      options,
      placeholder = 'Select an option',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-label-standard text-[#242A28] font-medium">
            {label}
            {required && <span className="text-[#b91c1c] ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled || isLoading}
            className={`w-full form-input-standard pr-10 appearance-none bg-white ${
              error ? 'form-input-error' : success ? 'border-[#287A64]' : ''
            } ${disabled ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : ''} ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#77817C]">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#174C40]" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        {error && (
          <p className="form-error-message">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && <p className="text-xs text-[#77817C] mt-1">{helperText}</p>}
      </div>
    );
  }
);
SelectInput.displayName = 'SelectInput';

// 3. Textarea
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseInputProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      isLoading,
      required,
      className = '',
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-label-standard text-[#242A28] font-medium">
            {label}
            {required && <span className="text-[#b91c1c] ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled || isLoading}
          className={`w-full rounded-xl border border-[#E5E8E6] bg-white p-3.5 text-sm text-[#242A28] placeholder:text-[#77817C] transition-colors focus:outline-none focus:border-[#287A64] focus:ring-2 focus:ring-[#287A64]/15 ${
            error ? 'border-[#b91c1c] bg-[#FEF2F2]' : success ? 'border-[#287A64]' : ''
          } ${disabled ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />

        {error && (
          <p className="form-error-message">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && <p className="text-xs text-[#77817C] mt-1">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// 4. Radio Group
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  selectedValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function RadioGroup({
  name,
  label,
  options,
  selectedValue,
  onChange,
  error,
  required,
  disabled,
}: RadioGroupProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-label-standard text-[#242A28] font-medium">
          {label}
          {required && <span className="text-[#b91c1c] ml-1">*</span>}
        </label>
      )}

      <div className="space-y-2">
        {options.map((opt) => {
          const isChecked = selectedValue === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                isChecked
                  ? 'border-[#174C40] bg-[#E6EFE9]/40'
                  : 'border-[#E5E8E6] bg-white hover:border-[#77817C]'
              } ${disabled || opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isChecked}
                disabled={disabled || opt.disabled}
                onChange={() => onChange?.(opt.value)}
                className="mt-0.5 h-4 w-4 text-[#174C40] focus:ring-[#174C40] border-[#E5E8E6]"
              />
              <div className="text-xs">
                <span className="font-medium text-[#242A28] block">{opt.label}</span>
                {opt.description && (
                  <span className="text-[#77817C] mt-0.5 block">{opt.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="form-error-message">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// 5. Checkbox
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', disabled, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className={`flex items-start gap-2.5 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={`mt-1 h-4 w-4 rounded border-[#E5E8E6] text-[#174C40] focus:ring-[#174C40] ${className}`}
            {...props}
          />
          <div className="text-xs text-[#242A28] leading-relaxed select-none">{label}</div>
        </label>
        {error && (
          <p className="form-error-message">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && <p className="text-xs text-[#77817C] pl-6">{helperText}</p>}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// 6. File Upload
export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect?: (file: File | null) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  label,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 10,
  onFileSelect,
  error,
  helperText,
  required,
  disabled,
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      onFileSelect?.(file);
    } else {
      setFileName(null);
      onFileSelect?.(null);
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-label-standard text-[#242A28] font-medium">
          {label}
          {required && <span className="text-[#b91c1c] ml-1">*</span>}
        </label>
      )}

      <div
        className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
          error
            ? 'border-[#b91c1c] bg-[#FEF2F2]'
            : 'border-[#E5E8E6] bg-white hover:border-[#174C40] hover:bg-[#FAFAF7]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="h-6 w-6 text-[#174C40]" />
          <p className="text-xs font-medium text-[#242A28]">
            {fileName ? (
              <span className="text-[#174C40] font-semibold">{fileName}</span>
            ) : (
              <>
                <span className="text-[#174C40] underline">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="text-[11px] text-[#77817C]">
            {helperText || `PDF, PNG, JPG up to ${maxSizeMB}MB`}
          </p>
        </div>
      </div>

      {error && (
        <p className="form-error-message">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
