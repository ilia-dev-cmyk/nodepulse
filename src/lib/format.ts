import type { DemoSettings, MonitorStatus, Severity, IncidentStatus } from '../data/types';

const MS_MINUTE = 60_000;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;

export function minutesAgo(minutes: number, from: number = Date.now()): string {
  return new Date(from - minutes * MS_MINUTE).toISOString();
}

export function hoursAgo(hours: number, from: number = Date.now()): string {
  return new Date(from - hours * MS_HOUR).toISOString();
}

export function daysAgo(days: number, from: number = Date.now()): string {
  return new Date(from - days * MS_DAY).toISOString();
}

export function formatRelative(input: string | null): string {
  if (!input) return 'Never';
  const time = new Date(input).getTime();
  const diff = Date.now() - time;
  const future = diff < 0;
  const abs = Math.abs(diff);

  if (abs < 45_000) return future ? 'in a moment' : 'just now';
  if (abs < MS_HOUR) {
    const mins = Math.round(abs / MS_MINUTE);
    return future ? `in ${mins}m` : `${mins}m ago`;
  }
  if (abs < MS_DAY) {
    const hours = Math.round(abs / MS_HOUR);
    return future ? `in ${hours}h` : `${hours}h ago`;
  }
  const days = Math.round(abs / MS_DAY);
  if (days < 30) return future ? `in ${days}d` : `${days}d ago`;
  const months = Math.round(days / 30);
  return future ? `in ${months}mo` : `${months}mo ago`;
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const SHORT_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export function formatAbsolute(input: string | null): string {
  if (!input) return '—';
  const date = new Date(input);
  return `${DATE_FORMAT.format(date)} · ${TIME_FORMAT.format(date)} UTC`;
}

export function formatShortDateTime(input: string): string {
  return `${SHORT_FORMAT.format(new Date(input))} UTC`;
}

/** Format a timestamp using the workspace display preference. */
export function formatTimestamp(
  input: string | null,
  preference: DemoSettings['timeDisplay'],
): string {
  if (!input) return '—';
  return preference === 'relative' ? formatRelative(input) : formatAbsolute(input);
}

export function formatDuration(startIso: string, endIso: string | null = null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const mins = Math.round(diff / MS_MINUTE);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins ? `${hours}h ${remMins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

export function formatDurationMs(ms: number): string {
  const minutes = Math.round(Math.max(0, ms) / MS_MINUTE);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours < 24) return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days}d ${restHours}h` : `${days}d`;
}

export function formatResponseTime(ms: number | null): string {
  if (ms === null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}

export function formatUptime(value: number | null, decimals = 2): string {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatInterval(minutes: number): string {
  if (minutes === 60) return 'Every hour';
  return `Every ${minutes} min`;
}

export const STATUS_META: Record<
  MonitorStatus,
  { label: string; tone: string; description: string; order: number }
> = {
  healthy: {
    label: 'Operational',
    tone: 'healthy',
    description: 'Responding normally',
    order: 0,
  },
  degraded: {
    label: 'Degraded',
    tone: 'warning',
    description: 'Responding slower than expected',
    order: 1,
  },
  down: {
    label: 'Down',
    tone: 'down',
    description: 'Not responding',
    order: 2,
  },
  paused: {
    label: 'Paused',
    tone: 'neutral',
    description: 'Monitoring disabled',
    order: 3,
  },
};

export const SEVERITY_META = {
  critical: { label: 'Critical', tone: 'down' },
  major: { label: 'Major', tone: 'warning' },
  minor: { label: 'Minor', tone: 'info' },
} as const satisfies Record<Severity, { label: string; tone: 'down' | 'warning' | 'info' }>;

export const INCIDENT_STATUS_META = {
  investigating: { label: 'Investigating', tone: 'down' },
  monitoring: { label: 'Monitoring', tone: 'warning' },
  resolved: { label: 'Resolved', tone: 'healthy' },
} as const satisfies Record<IncidentStatus, { label: string; tone: 'down' | 'warning' | 'healthy' }>;

export const RANGE_LABELS = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
} as const;
