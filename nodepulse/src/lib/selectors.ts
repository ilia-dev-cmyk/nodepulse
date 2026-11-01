import type { DemoNotification, Incident, Monitor, MonitorStatus } from '../data/types';
import { round } from './pseudo';

export interface MonitorCounts {
  all: number;
  healthy: number;
  degraded: number;
  down: number;
  paused: number;
}

export function getMonitorCounts(monitors: Monitor[]): MonitorCounts {
  const counts: MonitorCounts = {
    all: monitors.length,
    healthy: 0,
    degraded: 0,
    down: 0,
    paused: 0,
  };
  for (const monitor of monitors) {
    counts[monitor.status] += 1;
  }
  return counts;
}

const STATUS_ORDER: MonitorStatus[] = ['down', 'degraded', 'healthy', 'paused'];

export function sortMonitorsByAttention(monitors: Monitor[]): Monitor[] {
  return [...monitors].sort((a, b) => {
    const statusDelta =
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (statusDelta !== 0) return statusDelta;
    return a.name.localeCompare(b.name);
  });
}

export function getActiveIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter((incident) => incident.status !== 'resolved');
}

export function getRespondingMonitors(monitors: Monitor[]): Monitor[] {
  return monitors.filter(
    (monitor) => monitor.status !== 'paused' && monitor.responseTime !== null,
  );
}

export function getAverageResponse(monitors: Monitor[]): number | null {
  const values = getRespondingMonitors(monitors).map((monitor) => monitor.responseTime);
  const numeric = values.filter((value): value is number => value !== null);
  if (!numeric.length) return null;
  return round(numeric.reduce((total, value) => total + value, 0) / numeric.length, 0);
}

export function getFleetUptime(monitors: Monitor[]): number | null {
  const active = monitors.filter(
    (monitor) => monitor.status !== 'paused' && monitor.uptime !== null,
  );
  if (!active.length) return null;
  return round(
    active.reduce((total, monitor) => total + (monitor.uptime ?? 0), 0) / active.length,
    2,
  );
}

export function getIncidentSeverityCounts(incidents: Incident[]) {
  return {
    critical: incidents.filter((incident) => incident.severity === 'critical').length,
    major: incidents.filter((incident) => incident.severity === 'major').length,
    minor: incidents.filter((incident) => incident.severity === 'minor').length,
  };
}

export function getIncidentStatusCounts(incidents: Incident[]) {
  return {
    all: incidents.length,
    investigating: incidents.filter((incident) => incident.status === 'investigating').length,
    monitoring: incidents.filter((incident) => incident.status === 'monitoring').length,
    resolved: incidents.filter((incident) => incident.status === 'resolved').length,
  };
}

export function getUnreadNotificationCount(notifications: DemoNotification[]): number {
  return notifications.filter((notification) => !notification.read).length;
}

/** Incidents per severity across a rolling window, for compact visualisations. */
export function getIncidentSpread(incidents: Incident[], days: number) {
  const windowStart = Date.now() - days * 24 * 3_600_000;
  return incidents
    .filter((incident) => new Date(incident.startedAt).getTime() >= windowStart)
    .map((incident) => ({ severity: incident.severity, startedAt: incident.startedAt }));
}
