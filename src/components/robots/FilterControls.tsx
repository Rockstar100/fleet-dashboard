import { ROBOT_STATUSES } from '../../types/fleet';
import { STATUS_VISUALS } from '../../lib/statusVisuals';
import type { RobotFilters } from '../../lib/filterRobots';

interface Props {
  filters: RobotFilters;
  onChange: (next: RobotFilters) => void;
  attentionCount: number;
}

export function FilterControls({ filters, onChange, attentionCount }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        placeholder="Search robot ID or type…"
        className="w-full rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-ink-hi placeholder:text-ink-lo focus:border-accent focus:outline-none"
        aria-label="Search robots"
      />

      <div className="flex items-center gap-2">
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as RobotFilters['status'] })}
          className="rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs text-ink-mid focus:border-accent focus:outline-none"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ROBOT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_VISUALS[s].label}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-mid">
          <input
            type="checkbox"
            checked={filters.attentionOnly}
            onChange={(e) => onChange({ ...filters, attentionOnly: e.target.checked })}
            className="accent-accent"
          />
          Attention only
          <span className="rounded bg-red-500/15 px-1 text-[11px] font-semibold text-red-300">{attentionCount}</span>
        </label>
      </div>
    </div>
  );
}
