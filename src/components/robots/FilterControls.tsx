import { ROBOT_STATUSES } from '../../types/fleet';
import { STATUS_VISUALS } from '../../lib/statusVisuals';
import { AlertIcon, SearchIcon } from '../ui/icons';
import type { RobotFilters } from '../../lib/filterRobots';

interface Props {
  filters: RobotFilters;
  onChange: (next: RobotFilters) => void;
  attentionCount: number;
}

export function FilterControls({ filters, onChange, attentionCount }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-lo" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search robot ID or type"
          className="w-full rounded-md border border-line bg-surface-2 py-1.5 pl-8 pr-2.5 text-[13px] text-ink-hi placeholder:text-ink-lo focus:border-accent focus:outline-none"
          aria-label="Search robots"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as RobotFilters['status'] })}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-xs text-ink-mid focus:border-accent focus:outline-none"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ROBOT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_VISUALS[s].label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onChange({ ...filters, attentionOnly: !filters.attentionOnly })}
          aria-pressed={filters.attentionOnly}
          className={`focus-ring flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
            filters.attentionOnly
              ? 'border-red-500/40 bg-red-500/15 text-red-300'
              : 'border-line bg-surface-2 text-ink-mid hover:bg-surface-3'
          }`}
        >
          <AlertIcon className="h-3.5 w-3.5" />
          Attention
          <span
            className={`rounded px-1 text-[10.5px] font-semibold tabular-nums ${
              filters.attentionOnly ? 'bg-red-500/25 text-red-200' : 'bg-surface-3 text-ink-mid'
            }`}
          >
            {attentionCount}
          </span>
        </button>
      </div>
    </div>
  );
}
