/** Small formatting helpers shared across the UI. */

/** Seconds -> "mm:ss". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Milliseconds since an event -> "3s ago" / "1m 12s ago" / "just now". */
export function formatAge(ageMs: number): string {
  if (ageMs < 1000) return 'just now';
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem === 0 ? `${minutes}m ago` : `${minutes}m ${rem}s ago`;
}

export function titleCase(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
