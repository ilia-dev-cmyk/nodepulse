import type { Monitor } from '../data/types';
import { STATUS_META } from './format';

export type MonitorSortPreset =
  | 'attention'
  | 'name-asc'
  | 'name-desc'
  | 'response-desc'
  | 'response-asc'
  | 'uptime-asc'
  | 'uptime-desc'
  | 'checked-desc';

export const SORT_OPTIONS: { value: MonitorSortPreset; label: string }[] = [
  { value: 'attention', label: 'Needs attention first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'response-desc', label: 'Slowest response' },
  { value: 'response-asc', label: 'Fastest response' },
  { value: 'uptime-asc', label: 'Lowest uptime' },
  { value: 'checked-desc', label: 'Recently checked' },
];

type SortColumn = 'name' | 'response' | 'uptime' | 'lastChecked';

const PRESET_BY_COLUMN: Record<SortColumn, MonitorSortPreset> = {
  name: 'name-asc',
  response: 'response-desc',
  uptime: 'uptime-asc',
  lastChecked: 'checked-desc',
};

/** Clicking a column applies its primary direction, clicking again flips it. */
export function nextPreset(current: MonitorSortPreset, column: SortColumn): MonitorSortPreset {
  const primary = PRESET_BY_COLUMN[column];
  if (current === primary) {
    if (column === 'name') return 'name-desc';
    if (column === 'response') return 'response-asc';
    if (column === 'uptime') return 'uptime-desc';
    return primary;
  }
  return primary;
}

export function sortPresetValue(preset: MonitorSortPreset): { column?: SortColumn; dir: 'asc' | 'desc' } {
  switch (preset) {
    case 'name-asc':
      return { column: 'name', dir: 'asc' };
    case 'name-desc':
      return { column: 'name', dir: 'desc' };
    case 'response-desc':
      return { column: 'response', dir: 'desc' };
    case 'response-asc':
      return { column: 'response', dir: 'asc' };
    case 'uptime-asc':
      return { column: 'uptime', dir: 'asc' };
    case 'uptime-desc':
      return { column: 'uptime', dir: 'desc' };
    case 'checked-desc':
      return { column: 'lastChecked', dir: 'desc' };
    default:
      return { dir: 'asc' };
  }
}

const nullsLast = (value: number | null, dir: 'asc' | 'desc'): number => {
  if (value === null) return Number.POSITIVE_INFINITY;
  return dir === 'desc' ? -value : value;
};

export function sortMonitors(monitors: Monitor[], preset: MonitorSortPreset): Monitor[] {
  const sorted = [...monitors];
  switch (preset) {
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'response-desc':
      return sorted.sort(
        (a, b) => nullsLast(a.responseTime, 'desc') - nullsLast(b.responseTime, 'desc'),
      );
    case 'response-asc':
      return sorted.sort(
        (a, b) => nullsLast(a.responseTime, 'asc') - nullsLast(b.responseTime, 'asc'),
      );
    case 'uptime-asc':
      return sorted.sort((a, b) => nullsLast(a.uptime, 'asc') - nullsLast(b.uptime, 'asc'));
    case 'uptime-desc':
      return sorted.sort((a, b) => nullsLast(a.uptime, 'desc') - nullsLast(b.uptime, 'desc'));
    case 'checked-desc':
      return sorted.sort((a, b) => {
        const aTime = a.lastChecked ? new Date(a.lastChecked).getTime() : -Infinity;
        const bTime = b.lastChecked ? new Date(b.lastChecked).getTime() : -Infinity;
        return bTime - aTime;
      });
    default:
      return sorted.sort((a, b) => {
        const delta = STATUS_META[a.status].order - STATUS_META[b.status].order;
        return delta !== 0 ? delta : a.name.localeCompare(b.name);
      });
  }
}
