import {
  Activity,
  Baby,
  Bone,
  Brain,
  HeartPulse,
  ShieldPlus,
  Siren,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Brain,
  Bone,
  ShieldPlus,
  Baby,
  Siren,
};

export default function DepartmentIcon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] || Activity;
  return <Icon className={className} />;
}
