/** Core data structures for the NodePulse demo dataset. */

export type MonitorStatus = 'healthy' | 'degraded' | 'down' | 'paused';

export type MonitorRegion = 'Frankfurt' | 'Virginia' | 'Singapore' | 'London' | 'Oregon';

export interface StatusEvent {
  at: string;
  status: MonitorStatus;
  note?: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  /** Uptime percentage over the trailing 30 days (sample); null when no checks exist. */
  uptime: number | null;
  /** Latest successful response time in ms. `null` when unavailable. */
  responseTime: number | null;
  region: MonitorRegion;
  regionCode: string;
  /** Monitoring interval in minutes. */
  interval: number;
  lastChecked: string | null;
  description: string;
  /** Hourly successful response times for the trailing 24 hours. */
  responseHistory: number[];
  statusHistory: StatusEvent[];
  /** Present on monitors created inside the demo session. */
  createdInDemo?: boolean;
}

export type Severity = 'critical' | 'major' | 'minor';

export type IncidentStatus = 'investigating' | 'monitoring' | 'resolved';

export interface TimelineEntry {
  id: string;
  at: string;
  title: string;
  detail?: string;
  author: string;
  addedInDemo?: boolean;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  affectedMonitorIds: string[];
  description: string;
  impact: string;
  rootCause: string;
  startedAt: string;
  resolvedAt: string | null;
  timeline: TimelineEntry[];
}

export type NotificationKind = 'down' | 'degraded' | 'recovered' | 'digest';

export interface DemoNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string;
}

export interface DemoAlerts {
  incident: boolean;
  degraded: boolean;
  recovery: boolean;
}

export interface DemoSettings {
  workspaceName: string;
  defaultInterval: number;
  timeDisplay: 'relative' | 'absolute';
  density: 'comfortable' | 'compact';
  alerts: DemoAlerts;
  theme: 'dark' | 'light';
}

export type TimeRange = '24h' | '7d' | '30d';

export interface SeriesPoint {
  label: string;
  value: number | null;
  at: string;
}
