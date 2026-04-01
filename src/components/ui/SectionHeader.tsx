import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon?: LucideIcon;
  label: string;
  className?: string;
}

export function SectionHeader({ icon: Icon, label, className = '' }: SectionHeaderProps) {
  return (
    <h3 className={`label-md text-[10px] text-on-surface-variant flex items-center gap-2 ${className}`}>
      {Icon && <Icon size={14} />} {label}
    </h3>
  );
}
