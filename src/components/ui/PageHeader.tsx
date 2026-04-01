import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, badge, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 ${className}`}>
      <div className="space-y-4">
        {badge && (
          <div className="flex items-center gap-2">
            <span className="label-md text-[10px] text-primary font-bold">{badge}</span>
            <div className="h-px w-12 bg-outline-variant/10" />
          </div>
        )}
        <h1 className="display-lg">{title}</h1>
        {description && (
          <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-4">
          {actions}
        </div>
      )}
    </header>
  );
}
