import type { ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
}

interface Props<T extends string> {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}

/** Compact pill-group selector — used for the mode switch and the playback speed. */
export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel, size = 'md' }: Props<T>) {
  const pad = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';
  return (
    <div className="inline-flex rounded-md border border-line bg-surface-2 p-0.5" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`focus-ring rounded font-semibold capitalize transition-colors duration-150 ${pad} ${
            value === opt.value ? 'bg-accent text-surface-0' : 'text-ink-mid hover:text-ink-hi'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
