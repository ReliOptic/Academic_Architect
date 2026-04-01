import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'tertiary' | 'surface' | 'error' | 'success';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'surface', 
  className = '' 
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary/10 text-primary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    surface: 'bg-on-surface-variant/10 text-on-surface-variant',
    error: 'bg-error/10 text-error',
    success: 'bg-status-active/10 text-tertiary',
  };

  return (
    <span className={`px-2 py-1 rounded-full label-md text-[9px] font-bold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
