import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowUpDown, Pause, Play } from 'lucide-react';
import { Badge, StatusBadge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import type { Monitor } from '../../data/types';
import { formatResponseTime, formatTimestamp, formatUptime } from '../../lib/format';
import { nextPreset, sortPresetValue, type MonitorSortPreset } from '../../lib/sorting';
import { cn } from '../../lib/cn';

type SortColumn = 'name' | 'response' | 'uptime' | 'lastChecked';

function SortableTh({
  label,
  column,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: MonitorSortPreset;
  onSortChange: (preset: MonitorSortPreset) => void;
  className?: string;
}) {
  const active = sortPresetValue(sort);
  const isActive = active.column === column;
  return (
    <th
      scope="col"
      className={className}
      aria-sort={isActive ? (active.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        className={cn('th-sort', isActive && 'is-active')}
        onClick={() => onSortChange(nextPreset(sort, column))}
      >
        {label}
        <ArrowUpDown size={12} aria-hidden="true" className="th-sort__icon" />
      </button>
    </th>
  );
}

export function MonitorTable({
  monitors,
  onSelect,
  onToggleStatus,
  timeDisplay,
  showRegion = false,
  sort,
  onSortChange,
  emptyState,
}: {
  monitors: Monitor[];
  onSelect: (id: string) => void;
  onToggleStatus: (monitor: Monitor) => void;
  timeDisplay: 'relative' | 'absolute';
  showRegion?: boolean;
  sort?: MonitorSortPreset;
  onSortChange?: (preset: MonitorSortPreset) => void;
  emptyState?: ReactNode;
}) {
  if (!monitors.length && emptyState) return <>{emptyState}</>;

  return (
    <div className="table-scroll">
      <table className="data-table monitor-table">
        <caption className="sr-only">
          Monitors with status, endpoint, uptime and response time. Select a monitor to open its
          details.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="col-status">
              Status
            </th>
            {sort && onSortChange ? (
              <SortableTh label="Monitor" column="name" sort={sort} onSortChange={onSortChange} />
            ) : (
              <th scope="col">Monitor</th>
            )}
            <th scope="col" className="col-endpoint">
              Endpoint
            </th>
            {showRegion && (
              <th scope="col" className="col-region">
                Region
              </th>
            )}
            {sort && onSortChange ? (
              <>
                <SortableTh label="Uptime" column="uptime" sort={sort} onSortChange={onSortChange} className="col-num" />
                <SortableTh label="Response" column="response" sort={sort} onSortChange={onSortChange} className="col-num" />
                <SortableTh label="Last check" column="lastChecked" sort={sort} onSortChange={onSortChange} />
              </>
            ) : (
              <>
                <th scope="col" className="col-num">
                  Uptime
                </th>
                <th scope="col" className="col-num">
                  Response
                </th>
                <th scope="col">Last check</th>
              </>
            )}
            <th scope="col" className="col-actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {monitors.map((monitor) => (
            <tr
              key={monitor.id}
              className="data-table__row is-clickable"
              onClick={() => onSelect(monitor.id)}
            >
              <td data-label="Status">
                <StatusBadge status={monitor.status} />
              </td>
              <td data-label="Monitor" className="cell-name">
                <span className="monitor-name-row">
                  <button
                    type="button"
                    className="monitor-name"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(monitor.id);
                    }}
                  >
                    {monitor.name}
                  </button>
                  {monitor.createdInDemo && <Badge tone="accent">New</Badge>}
                </span>
                <span className="monitor-subline mono">{monitor.id}</span>
              </td>
              <td data-label="Endpoint" className="cell-endpoint">
                <span className="endpoint mono" title={monitor.url}>
                  {monitor.url}
                </span>
              </td>
              {showRegion && (
                <td data-label="Region" className="cell-region">
                  <span className="region-cell">
                    {monitor.region}
                    <span className="region-cell__code">{monitor.regionCode}</span>
                  </span>
                </td>
              )}
              <td data-label="Uptime" className={cn('cell-num', monitor.uptime === null && 'is-muted')}>
                {formatUptime(monitor.uptime)}
              </td>
              <td
                data-label="Response"
                className={cn('cell-num', monitor.responseTime === null && 'is-muted')}
              >
                {formatResponseTime(monitor.responseTime)}
              </td>
              <td data-label="Last check" className="cell-time">
                {formatTimestamp(monitor.lastChecked, timeDisplay)}
              </td>
              <td className="cell-actions">
                <div className="row-actions">
                  <IconButton
                    size="sm"
                    label={`View ${monitor.name} details`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(monitor.id);
                    }}
                  >
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    size="sm"
                    label={
                      monitor.status === 'paused'
                        ? `Resume monitoring for ${monitor.name}`
                        : `Pause monitoring for ${monitor.name}`
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleStatus(monitor);
                    }}
                  >
                    {monitor.status === 'paused' ? (
                      <Play size={14} aria-hidden="true" />
                    ) : (
                      <Pause size={14} aria-hidden="true" />
                    )}
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
