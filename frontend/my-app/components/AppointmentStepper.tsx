import Link from 'next/link';
import { Check } from 'lucide-react';

const STEPS = [
  { step: 1, label: 'Find a Doctor', href: '/appointments/doctors' },
  { step: 2, label: 'Select Slot', href: '/appointments/book' },
  { step: 3, label: 'Patient Details', href: '/appointments/patient-details' },
  { step: 4, label: 'Confirmation', href: '/appointments/confirmation' },
];

export default function AppointmentStepper({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Booking progress" className="border-b border-[#e6e4dd] bg-white">
      <div className="container-editorial py-4">
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STEPS.map((item) => {
            const isDone = item.step < currentStep;
            const isCurrent = item.step === currentStep;
            const content = (
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-6 w-6 rounded-full text-[11px] font-mono flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-[#0f5c5c] text-white'
                      : isCurrent
                      ? 'bg-[#14181a] text-white'
                      : 'border border-[#d5d2c9] text-[#768086]'
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : item.step}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isCurrent
                      ? 'text-[#14181a]'
                      : isDone
                      ? 'text-[#0f5c5c]'
                      : 'text-[#768086]'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );

            return (
              <li key={item.step} className="flex items-center">
                {isDone ? (
                  <Link href={item.href} className="hover:opacity-80 transition-opacity">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
