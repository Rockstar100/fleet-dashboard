import type { ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Extra classes on the outer <section> — use for flex sizing from the parent grid. */
  className?: string;
  /** Extra classes on the content wrapper — override padding/scroll behaviour. */
  contentClassName?: string;
  padded?: boolean;
}

/**
 * The one card shell used across the dashboard: a bordered surface with an
 * optional header row (title + meta + actions). Everything that used to be
 * its own ad-hoc `rounded-xl border border-line bg-surface-1` div goes
 * through here instead, so the "what does a panel look like" decision has
 * exactly one home.
 */
export function Panel({ title, meta, actions, children, className = '', contentClassName = '', padded = true }: Props) {
  return (
    <section className={`flex flex-col rounded-xl border border-line bg-surface-1 ${className}`}>
      {(title || actions) && (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="flex items-baseline gap-2 min-w-0">
            {title && <h2 className="truncate text-sm font-semibold text-ink-hi">{title}</h2>}
            {meta && <span className="shrink-0 text-xs text-ink-lo">{meta}</span>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`flex min-h-0 flex-1 flex-col ${padded ? 'p-4' : ''} ${contentClassName}`}>{children}</div>
    </section>
  );
}
