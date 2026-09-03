import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

/**
 * A deliberate "nothing here yet" state — not an error, not a loading spinner.
 *
 * No `flex-1` by default: a compact box that sizes to its content. Pass
 * `className="flex-1"` from a caller that specifically wants it to fill
 * available space (the empty robot-list result); a caller like "no robot
 * selected" should stay compact rather than stretching into a mostly-empty
 * dashed rectangle whenever there happens to be leftover panel height.
 */
export function EmptyState({ icon, title, description, className = '' }: Props) {
  return (
    <div className={`grid place-items-center rounded-lg border border-dashed border-line px-6 py-8 text-center ${className}`}>
      <div className="flex max-w-[240px] flex-col items-center gap-2">
        {icon && <div className="text-ink-lo">{icon}</div>}
        <div className="text-sm font-medium text-ink-mid">{title}</div>
        {description && <div className="text-xs leading-relaxed text-ink-lo">{description}</div>}
      </div>
    </div>
  );
}
