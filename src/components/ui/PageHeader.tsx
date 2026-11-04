import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  if (!actions) {
    return (
      <div className={className}>
        <h1 className="text-2xl sm:text-3xl font-black text-[#4b2417] tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#6f5448]">{description}</p>}
      </div>
    );
  }

  return (
    <div className={className || 'flex flex-col sm:flex-row sm:items-center justify-between gap-4'}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#4b2417] tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#6f5448]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export default PageHeader;
