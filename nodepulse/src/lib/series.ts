import type { Incident, Monitor, SeriesPoint, TimeRange } from '../data/types';
import { clamp, hashSeed, noise, round } from './pseudo';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const RANGE_CONFIG: Record<
  TimeRange,
  { label: string; points: number; bucketMs: number; tickEvery: number; short: string }
> = {
  '24h': { label: 'Last 24 hours', points: 24, bucketMs: HOUR, tickEvery: 6, short: '24h' },
  '7d': { label: 'Last 7 days', points: 28, bucketMs: 6 * HOUR, tickEvery: 7, short: '7d' },
  '30d': { label: 'Last 30 days', points: 30, bucketMs: DAY, tickEvery: 6, short: '30d' },
};

export const RANGES: TimeRange[] = ['24h', '7d', '30d'];

const hourFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

export const SEVERITY_WEIGHT = { critical: 0.6, major: 0.34, minor: 0.14 } as const;

function bucketTimestamps(range: TimeRange, now = Date.now()): number[] {
  const config = RANGE_CONFIG[range];
  const times: number[] = [];
  for (let i = 0; i < config.points; i += 1) {
    const offset = (config.points - 1 - i) * config.bucketMs;
    times.push(now - offset);
  }
  return times;
}

export function bucketAxisLabel(range: TimeRange, at: string): string {
  const date = new Date(at);
  return range === '24h' ? hourFormat.format(date) : dayFormat.format(date);
}

/** Buckets in which an incident first appeared, used to correlate chart dips. */
function incidentImpact(incidents: Incident[], range: TimeRange, atMs: number): number {
  const bucket = RANGE_CONFIG[range].bucketMs;
  let impact = 0;
  for (const incident of incidents) {
    const start = new Date(incident.startedAt).getTime();
    if (start >= atMs - bucket && start <= atMs) {
      impact += SEVERITY_WEIGHT[incident.severity];
    }
  }
  return impact;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/** Aggregate uptime percentage per bucket for the selected range. */
export function buildUptimeSeries(
  monitors: Monitor[],
  incidents: Incident[],
  range: TimeRange,
): SeriesPoint[] {
  const active = monitors.filter(
    (monitor) => monitor.status !== 'paused' && monitor.uptime !== null,
  );
  if (!active.length) return [];
  const baseUptime = mean(active.map((monitor) => monitor.uptime ?? 100));
  const deficit = Math.max(0.02, 100 - baseUptime);
  const seed = hashSeed(`uptime-${range}-${active.map((monitor) => monitor.id).join('|')}`);

  return bucketTimestamps(range).map((timestamp, index) => {
    const at = new Date(timestamp).toISOString();
    const variance = 0.45 + noise(seed, index) * 0.85;
    const incidentPenalty = incidentImpact(incidents, range, timestamp) * 0.4;
    const value = clamp(100 - deficit * variance - incidentPenalty, 97.5, 100);
    return {
      label: bucketAxisLabel(range, at),
      value: round(value, 2),
      at,
    };
  });
}

/** Total successful response times for one monitor across a range. */
export function buildMonitorResponseSeries(
  monitor: Monitor,
  incidents: Incident[],
  range: TimeRange,
): (number | null)[] {
  const seed = hashSeed(`${monitor.id}-${range}`);
  const base =
    monitor.responseTime ??
    (monitor.responseHistory.length ? mean(monitor.responseHistory) : null);
  const bucket = RANGE_CONFIG[range].bucketMs;

  return bucketTimestamps(range).map((timestamp, index) => {
    if (base === null) return null;
    // A monitor that is currently down has no successful response in the most
    // recent buckets; the gap is rendered explicitly rather than invented.
    if (monitor.status === 'down' && index >= RANGE_CONFIG[range].points - 3) {
      return null;
    }
    const drift = (noise(seed, index) - 0.5) * 0.24;
    const wave = Math.sin((index / RANGE_CONFIG[range].points) * Math.PI * 2.2) * 0.06;
    const impact = incidentImpact(incidents, range, timestamp);
    const affected = incidents.some(
      (incident) =>
        incident.affectedMonitorIds.includes(monitor.id) &&
        Math.abs(new Date(incident.startedAt).getTime() - timestamp) < bucket,
    );
    const penalty = affected ? impact * base * 0.55 : 0;
    return round(Math.max(24, base * (1 + drift + wave) + penalty), 0);
  });
}

/** Average response time across responsive monitors per bucket. */
export function buildAggregateResponseSeries(
  monitors: Monitor[],
  incidents: Incident[],
  range: TimeRange,
): SeriesPoint[] {
  const eligible = monitors.filter(
    (monitor) =>
      monitor.status !== 'paused' &&
      monitor.status !== 'down' &&
      (monitor.responseTime !== null || monitor.responseHistory.length > 0),
  );
  if (!eligible.length) return [];
  const times = bucketTimestamps(range);
  const perMonitor = eligible.map((monitor) => ({
    monitor,
    values: buildMonitorResponseSeries(monitor, incidents, range),
  }));

  return times.map((timestamp, index) => {
    const at = new Date(timestamp).toISOString();
    const values = perMonitor
      .map((entry) => entry.values[index])
      .filter((value): value is number => value !== null);
    return {
      label: bucketAxisLabel(range, at),
      value: values.length ? round(mean(values), 0) : null,
      at,
    };
  });
}

export interface RegionStat {
  region: string;
  code: string;
  monitorCount: number;
  averageResponse: number | null;
  averageUptime: number | null;
  healthyCount: number;
}

/** Aggregate regional performance from the current monitor dataset. */
export function getRegionStats(monitors: Monitor[]): RegionStat[] {
  const groups = new Map<string, { code: string; items: Monitor[] }>();
  for (const monitor of monitors) {
    const existing = groups.get(monitor.region);
    if (existing) {
      existing.items.push(monitor);
    } else {
      groups.set(monitor.region, { code: monitor.regionCode, items: [monitor] });
    }
  }

  return [...groups.entries()]
    .map(([region, group]) => {
      const responses = group.items
        .map((monitor) => monitor.responseTime)
        .filter((value): value is number => value !== null);
      const uptimes = group.items
        .map((monitor) => monitor.uptime)
        .filter((value): value is number => value !== null);
      return {
        region,
        code: group.code,
        monitorCount: group.items.length,
        averageResponse: responses.length ? round(mean(responses), 0) : null,
        averageUptime: uptimes.length ? round(mean(uptimes), 2) : null,
        healthyCount: group.items.filter((monitor) => monitor.status === 'healthy').length,
      };
    })
    .sort((a, b) => (a.averageResponse ?? Infinity) - (b.averageResponse ?? Infinity));
}

/** Compare series for up to four monitors on the analytics page. */
export function buildComparisonSeries(
  monitors: Monitor[],
  incidents: Incident[],
  range: TimeRange,
): { monitor: Monitor; values: (number | null)[] }[] {
  return monitors.map((monitor) => ({
    monitor,
    values: buildMonitorResponseSeries(monitor, incidents, range),
  }));
}

export function rangeStart(range: TimeRange): Date {
  return new Date(Date.now() - RANGE_CONFIG[range].points * RANGE_CONFIG[range].bucketMs);
}
