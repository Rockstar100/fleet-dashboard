import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

/** A deliberate "nothing here yet" state — not an error, not a loading spinner. */
export function EmptyState({ icon, title, description, className = '' }: Props) {
  return (
    <div className={`grid flex-1 place-items-center rounded-lg border border-dashed border-line px-6 py-8 text-center ${className}`}>
      <div className="flex max-w-[240px] flex-col items-center gap-2">
        {icon && <div className="text-ink-lo">{icon}</div>}
        <div className="text-sm font-medium text-ink-mid">{title}</div>
        {description && <div className="text-xs leading-relaxed text-ink-lo">{description}</div>}
      </div>
    </div>
  );
}
