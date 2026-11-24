const TONE_MAP: Record<string, string> = {
  emerald: 'bg-[#e7f3f0] text-[#0f5c5c] border-[#cde4de]',
  slate: 'bg-[#eceff2] text-[#2c3a47] border-[#d8dee4]',
  stone: 'bg-[#f1efe9] text-[#4a463f] border-[#dfdbd1]',
  teal: 'bg-[#e6f2f2] text-[#115e59] border-[#c8e2e2]',
  amber: 'bg-[#f6efe2] text-[#7c5522] border-[#e7dac1]',
  rose: 'bg-[#f8ecec] text-[#991b1b] border-[#ebd4d4]',
};

export default function DoctorAvatar({
  initials,
  tone = 'slate',
  size = 'md',
}: {
  initials: string;
  tone?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const palette = TONE_MAP[tone] || TONE_MAP.slate;
  const sizeClass =
    size === 'lg'
      ? 'h-20 w-20 text-xl'
      : size === 'sm'
      ? 'h-10 w-10 text-xs'
      : 'h-14 w-14 text-sm';

  return (
    <div
      className={`rounded-full border font-mono font-medium tracking-wider flex items-center justify-center shrink-0 ${palette} ${sizeClass}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
