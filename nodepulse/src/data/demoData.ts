import type {
  DemoNotification,
  DemoSettings,
  Incident,
  Monitor,
  MonitorRegion,
  MonitorStatus,
  StatusEvent,
} from './types';
import { daysAgo, hoursAgo, minutesAgo } from '../lib/format';
import { hashSeed, noise, round } from '../lib/pseudo';

export const DEMO_NOW = Date.now();

interface MonitorSeed {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  uptime: number;
  responseTime: number | null;
  region: MonitorRegion;
  regionCode: string;
  interval: number;
  description: string;
  historyBase: number;
  lastCheckedMinutes: number;
  history?: StatusEvent[];
}

export const REGIONS: { name: MonitorRegion; code: string }[] = [
  { name: 'Frankfurt', code: 'eu-central' },
  { name: 'Virginia', code: 'us-east' },
  { name: 'Singapore', code: 'ap-southeast' },
  { name: 'London', code: 'eu-west' },
  { name: 'Oregon', code: 'us-west' },
];

export const INTERVAL_OPTIONS = [1, 2, 5, 15, 30, 60];

/** Weighted mix of hourly successful response times for a monitor. */
export function buildResponseHistory(base: number, seedId: string, points = 24): number[] {
  const seed = hashSeed(seedId);
  const values: number[] = [];
  for (let i = 0; i < points; i += 1) {
    const drift = (noise(seed, i) - 0.5) * 0.26;
    const wave = Math.sin((i / points) * Math.PI * 2 + (seed % 5)) * 0.07;
    const spike = noise(seed, i + 41) > 0.9 ? 0.22 : 0;
    values.push(round(Math.max(38, base * (1 + drift + wave + spike)), 0));
  }
  values[points - 1] = base;
  return values;
}

const monitorSeeds: MonitorSeed[] = [
  {
    id: 'core-api',
    name: 'Core API',
    url: 'https://api.nodepulse.demo/v1/health',
    status: 'healthy',
    uptime: 99.99,
    responseTime: 128,
    region: 'Virginia',
    regionCode: 'us-east',
    interval: 1,
    description: 'Primary REST API serving customer dashboards and integrations.',
    historyBase: 128,
    lastCheckedMinutes: 1,
    history: [
      { at: hoursAgo(1.5, DEMO_NOW), status: 'healthy', note: '12 consecutive checks passed' },
      { at: daysAgo(3, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'marketing-site',
    name: 'Marketing Site',
    url: 'https://nodepulse.demo',
    status: 'healthy',
    uptime: 99.97,
    responseTime: 164,
    region: 'Frankfurt',
    regionCode: 'eu-central',
    interval: 5,
    description: 'Public marketing pages and the pricing calculator.',
    historyBase: 164,
    lastCheckedMinutes: 3,
    history: [
      { at: hoursAgo(2, DEMO_NOW), status: 'healthy', note: 'Document check completed successfully' },
      { at: daysAgo(5, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'checkout-service',
    name: 'Checkout Service',
    url: 'https://checkout.nodepulse.demo/healthz',
    status: 'degraded',
    uptime: 99.82,
    responseTime: 412,
    region: 'Virginia',
    regionCode: 'us-east',
    interval: 1,
    description: 'Payment intent creation and checkout session orchestration.',
    historyBase: 412,
    lastCheckedMinutes: 1,
    history: [
      {
        at: minutesAgo(47, DEMO_NOW),
        status: 'degraded',
        note: 'Response time above the 400 ms threshold',
      },
      { at: hoursAgo(5, DEMO_NOW), status: 'healthy', note: 'Monitor operating normally' },
      { at: daysAgo(4, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'authentication',
    name: 'Authentication',
    url: 'https://auth.nodepulse.demo/status',
    status: 'healthy',
    uptime: 99.995,
    responseTime: 96,
    region: 'London',
    regionCode: 'eu-west',
    interval: 1,
    description: 'Session tokens, SSO handoff and refresh endpoints.',
    historyBase: 96,
    lastCheckedMinutes: 1,
    history: [
      { at: hoursAgo(4, DEMO_NOW), status: 'healthy', note: 'Token refresh checks passing' },
      { at: daysAgo(2, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'webhooks',
    name: 'Webhooks Dispatcher',
    url: 'https://hooks.nodepulse.demo/ping',
    status: 'healthy',
    uptime: 99.94,
    responseTime: 208,
    region: 'Oregon',
    regionCode: 'us-west',
    interval: 2,
    description: 'Outbound event delivery with exponential backoff retries.',
    historyBase: 208,
    lastCheckedMinutes: 2,
    history: [
      { at: hoursAgo(6, DEMO_NOW), status: 'healthy', note: 'Recovered after a 9 minute latency spike' },
      { at: hoursAgo(7, DEMO_NOW), status: 'degraded', note: 'Delivery queue backlog detected' },
      { at: daysAgo(6, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'dashboard-app',
    name: 'Dashboard App',
    url: 'https://app.nodepulse.demo',
    status: 'healthy',
    uptime: 99.99,
    responseTime: 143,
    region: 'Frankfurt',
    regionCode: 'eu-central',
    interval: 1,
    description: 'Authenticated workspace application and static assets.',
    historyBase: 143,
    lastCheckedMinutes: 1,
    history: [
      { at: hoursAgo(3, DEMO_NOW), status: 'healthy', note: 'Document check completed successfully' },
      { at: daysAgo(9, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'public-api',
    name: 'Public API',
    url: 'https://api-public.nodepulse.demo/health',
    status: 'healthy',
    uptime: 99.96,
    responseTime: 187,
    region: 'Singapore',
    regionCode: 'ap-southeast',
    interval: 1,
    description: 'Rate-limited public endpoints used by partner integrations.',
    historyBase: 187,
    lastCheckedMinutes: 1,
    history: [
      { at: hoursAgo(2.5, DEMO_NOW), status: 'healthy', note: 'All regional probes passing' },
      { at: daysAgo(7, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'data-ingestion',
    name: 'Data Ingestion',
    url: 'https://ingest.nodepulse.demo/health',
    status: 'healthy',
    uptime: 99.91,
    responseTime: 246,
    region: 'Virginia',
    regionCode: 'us-east',
    interval: 2,
    description: 'Event intake pipeline feeding the analytics warehouse.',
    historyBase: 246,
    lastCheckedMinutes: 2,
    history: [
      { at: hoursAgo(8, DEMO_NOW), status: 'healthy', note: 'Queue depth back within target range' },
      { at: hoursAgo(9, DEMO_NOW), status: 'degraded', note: 'Batch processing delay above threshold' },
      { at: daysAgo(11, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'status-page',
    name: 'Status Page',
    url: 'https://status.nodepulse.demo',
    status: 'healthy',
    uptime: 100,
    responseTime: 74,
    region: 'London',
    regionCode: 'eu-west',
    interval: 5,
    description: 'Public availability page and subscriber notifications.',
    historyBase: 74,
    lastCheckedMinutes: 4,
    history: [
      { at: daysAgo(30, DEMO_NOW), status: 'healthy', note: 'No status changes in 30 days' },
    ],
  },
  {
    id: 'billing-api',
    name: 'Billing API',
    url: 'https://billing.nodepulse.demo/health',
    status: 'down',
    uptime: 98.64,
    responseTime: null,
    region: 'Virginia',
    regionCode: 'us-east',
    interval: 1,
    description: 'Subscription billing, invoices and usage metering.',
    historyBase: 259,
    lastCheckedMinutes: 1,
    history: [
      { at: minutesAgo(192, DEMO_NOW), status: 'down', note: 'Connection timeout after 10 s' },
      { at: hoursAgo(9, DEMO_NOW), status: 'healthy', note: 'Monitor operating normally' },
      { at: daysAgo(12, DEMO_NOW), status: 'degraded', note: 'Elevated response time on invoice endpoint' },
    ],
  },
  {
    id: 'search-service',
    name: 'Search Service',
    url: 'https://search.nodepulse.demo/healthz',
    status: 'healthy',
    uptime: 99.93,
    responseTime: 131,
    region: 'Singapore',
    regionCode: 'ap-southeast',
    interval: 2,
    description: 'Full-text search and saved-query execution.',
    historyBase: 131,
    lastCheckedMinutes: 2,
    history: [
      { at: hoursAgo(5, DEMO_NOW), status: 'healthy', note: 'Index refresh completed' },
      { at: daysAgo(8, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
  {
    id: 'image-cdn',
    name: 'Image CDN',
    url: 'https://cdn.nodepulse.demo/health',
    status: 'healthy',
    uptime: 99.99,
    responseTime: 158,
    region: 'Oregon',
    regionCode: 'us-west',
    interval: 5,
    description: 'Asset delivery edge with regional cache warming.',
    historyBase: 158,
    lastCheckedMinutes: 5,
    history: [
      { at: hoursAgo(6, DEMO_NOW), status: 'healthy', note: 'Edge cache hit rate within range' },
      { at: daysAgo(14, DEMO_NOW), status: 'healthy', note: 'No status changes detected' },
    ],
  },
];

export const demoMonitors: Monitor[] = monitorSeeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  url: seed.url,
  status: seed.status,
  uptime: seed.uptime,
  responseTime: seed.responseTime,
  region: seed.region,
  regionCode: seed.regionCode,
  interval: seed.interval,
  lastChecked: minutesAgo(seed.lastCheckedMinutes, DEMO_NOW),
  description: seed.description,
  responseHistory: buildResponseHistory(seed.historyBase, seed.id),
  statusHistory: seed.history ?? [],
}));

export const demoIncidents: Incident[] = [
  {
    id: 'INC-2481',
    title: 'Elevated error rate on Checkout Service',
    severity: 'major',
    status: 'investigating',
    affectedMonitorIds: ['checkout-service'],
    description:
      'Checkout session creation is returning elevated 5xx responses, and successful requests are completing well above the usual latency budget.',
    impact: 'Some customers may see a failed payment confirmation when checking out.',
    rootCause: 'Under investigation — a latency regression in the payment provider call path is suspected.',
    startedAt: minutesAgo(47, DEMO_NOW),
    resolvedAt: null,
    timeline: [
      {
        id: 't-2481-1',
        at: minutesAgo(47, DEMO_NOW),
        title: 'Incident opened automatically',
        detail: 'The Checkout Service health probe crossed the 400 ms latency threshold.',
        author: 'Sample monitor check',
      },
      {
        id: 't-2481-2',
        at: minutesAgo(39, DEMO_NOW),
        title: 'Degraded status confirmed',
        detail: '2 of 3 consecutive checks failed the latency assertion.',
        author: 'Sample monitor check',
      },
      {
        id: 't-2481-3',
        at: minutesAgo(24, DEMO_NOW),
        title: 'Investigating provider latency',
        detail: 'Sample timeline entry. In a real workspace this would record on-call investigation notes.',
        author: 'Maya Chen',
      },
    ],
  },
  {
    id: 'INC-2479',
    title: 'Billing API returning 503 responses',
    severity: 'critical',
    status: 'monitoring',
    affectedMonitorIds: ['billing-api'],
    description:
      'The Billing API health endpoint has stopped accepting connections. Invoice generation and usage metering are both affected.',
    impact: 'New subscription changes and invoice exports are unavailable while the service is down.',
    rootCause: 'Failover to the secondary instance completed; monitoring the recovery window.',
    startedAt: minutesAgo(192, DEMO_NOW),
    resolvedAt: null,
    timeline: [
      {
        id: 't-2479-1',
        at: minutesAgo(192, DEMO_NOW),
        title: 'Downtime detected',
        detail: 'Three consecutive connection timeouts on the health endpoint.',
        author: 'Sample monitor check',
      },
      {
        id: 't-2479-2',
        at: minutesAgo(178, DEMO_NOW),
        title: 'Severity raised to critical',
        detail: 'Billing traffic is fully impacted for the primary region.',
        author: 'Maya Chen',
      },
      {
        id: 't-2479-3',
        at: minutesAgo(140, DEMO_NOW),
        title: 'Failover initiated',
        detail: 'Traffic moved to the standby instance in Virginia.',
        author: 'Maya Chen',
      },
      {
        id: 't-2479-4',
        at: minutesAgo(52, DEMO_NOW),
        title: 'Recovery window started',
        detail: 'Standby instance is accepting traffic; observing error rates before resolving.',
        author: 'Maya Chen',
      },
    ],
  },
  {
    id: 'INC-2478',
    title: 'Checkout latency spike after deploy',
    severity: 'major',
    status: 'resolved',
    affectedMonitorIds: ['checkout-service'],
    description:
      'Response times doubled immediately after a routine deployment. Traffic was rolled back to the previous release.',
    impact: 'Checkout completion slowed for roughly 20 minutes.',
    rootCause: 'Rollback to the previous release restored normal latency.',
    startedAt: hoursAgo(26, DEMO_NOW),
    resolvedAt: hoursAgo(22.4, DEMO_NOW),
    timeline: [
      {
        id: 't-2478-1',
        at: hoursAgo(26, DEMO_NOW),
        title: 'Latency alert triggered',
        detail: 'Median response time rose from 320 ms to 690 ms.',
        author: 'Sample monitor check',
      },
      {
        id: 't-2478-2',
        at: hoursAgo(25.2, DEMO_NOW),
        title: 'Rollback started',
        detail: 'Deployment reverted while the cause is investigated.',
        author: 'Maya Chen',
      },
      {
        id: 't-2478-3',
        at: hoursAgo(22.4, DEMO_NOW),
        title: 'Incident resolved',
        detail: 'Latency returned to baseline and remained stable for 60 minutes.',
        author: 'Maya Chen',
      },
    ],
  },
  {
    id: 'INC-2476',
    title: 'Authentication token refresh failures',
    severity: 'minor',
    status: 'resolved',
    affectedMonitorIds: ['authentication'],
    description: 'A subset of token refresh requests were rejected during a configuration rollout.',
    impact: 'A small number of sessions required re-authentication.',
    rootCause: 'An out-of-date signing key was served from one edge cache.',
    startedAt: daysAgo(2.1, DEMO_NOW),
    resolvedAt: daysAgo(2.02, DEMO_NOW),
    timeline: [
      {
        id: 't-2476-1',
        at: daysAgo(2.1, DEMO_NOW),
        title: 'Refresh failures detected',
        author: 'Sample monitor check',
      },
      {
        id: 't-2476-2',
        at: daysAgo(2.06, DEMO_NOW),
        title: 'Edge cache purged',
        detail: 'Signing keys refreshed across all regions.',
        author: 'Maya Chen',
      },
      {
        id: 't-2476-3',
        at: daysAgo(2.02, DEMO_NOW),
        title: 'Incident resolved',
        author: 'Maya Chen',
      },
    ],
  },
  {
    id: 'INC-2472',
    title: 'Webhook delivery backlog',
    severity: 'major',
    status: 'resolved',
    affectedMonitorIds: ['webhooks'],
    description: 'A downstream consumer stopped acknowledging deliveries, growing the retry queue.',
    impact: 'Webhook deliveries were delayed by up to 9 minutes.',
    rootCause: 'The affected consumer restarted and drained the backlog.',
    startedAt: daysAgo(4.4, DEMO_NOW),
    resolvedAt: daysAgo(4.34, DEMO_NOW),
    timeline: [
      {
        id: 't-2472-1',
        at: daysAgo(4.4, DEMO_NOW),
        title: 'Queue depth alert',
        detail: 'Pending deliveries exceeded the 5,000 event threshold.',
        author: 'Sample monitor check',
      },
      {
        id: 't-2472-2',
        at: daysAgo(4.36, DEMO_NOW),
        title: 'Consumer restarted',
        author: 'Maya Chen',
      },
      {
        id: 't-2472-3',
        at: daysAgo(4.34, DEMO_NOW),
        title: 'Incident resolved',
        detail: 'Queue returned to normal depth.',
        author: 'Maya Chen',
      },
    ],
  },
  {
    id: 'INC-2469',
    title: 'Singapore API elevated response times',
    severity: 'minor',
    status: 'resolved',
    affectedMonitorIds: ['public-api', 'search-service'],
    description: 'Cross-region requests to the Singapore probe showed sustained elevated latency.',
    impact: 'Partner API calls from the APAC region were slower than usual.',
    rootCause: 'Upstream transit provider re-routed traffic after a peering maintenance window.',
    startedAt: daysAgo(9.3, DEMO_NOW),
    resolvedAt: daysAgo(9.12, DEMO_NOW),
    timeline: [
      {
        id: 't-2469-1',
        at: daysAgo(9.3, DEMO_NOW),
        title: 'Regional latency alert',
        author: 'Sample monitor check',
      },
      {
        id: 't-2469-2',
        at: daysAgo(9.18, DEMO_NOW),
        title: 'Transit path confirmed',
        detail: 'Provider maintenance window identified as the likely cause.',
        author: 'Maya Chen',
      },
      {
        id: 't-2469-3',
        at: daysAgo(9.12, DEMO_NOW),
        title: 'Incident resolved',
        author: 'Maya Chen',
      },
    ],
  },
  {
    id: 'INC-2461',
    title: 'Status page cache regression',
    severity: 'minor',
    status: 'resolved',
    affectedMonitorIds: ['status-page'],
    description: 'The status page served a cached snapshot for longer than intended.',
    impact: 'Availability information was briefly stale for public visitors.',
    rootCause: 'Cache invalidation was skipped during a scheduled deploy.',
    startedAt: daysAgo(18.6, DEMO_NOW),
    resolvedAt: daysAgo(18.44, DEMO_NOW),
    timeline: [
      {
        id: 't-2461-1',
        at: daysAgo(18.6, DEMO_NOW),
        title: 'Stale content reported',
        author: 'Sample monitor check',
      },
      {
        id: 't-2461-2',
        at: daysAgo(18.5, DEMO_NOW),
        title: 'Cache invalidated',
        author: 'Maya Chen',
      },
      {
        id: 't-2461-3',
        at: daysAgo(18.44, DEMO_NOW),
        title: 'Incident resolved',
        author: 'Maya Chen',
      },
    ],
  },
];

export const demoNotifications: DemoNotification[] = [
  {
    id: 'n-1',
    kind: 'down',
    title: 'Billing API is down',
    body: 'Three consecutive checks timed out at 10 s.',
    at: minutesAgo(192, DEMO_NOW),
    read: false,
    href: '/app/incidents?incident=INC-2479',
  },
  {
    id: 'n-2',
    kind: 'degraded',
    title: 'Checkout Service is degraded',
    body: 'Response time crossed the 400 ms review threshold.',
    at: minutesAgo(47, DEMO_NOW),
    read: false,
    href: '/app/incidents?incident=INC-2481',
  },
  {
    id: 'n-3',
    kind: 'recovered',
    title: 'Webhooks Dispatcher recovered',
    body: 'Latency returned to normal after a 9 minute spike.',
    at: hoursAgo(6.5, DEMO_NOW),
    read: true,
    href: '/app/monitors?monitor=webhooks',
  },
  {
    id: 'n-4',
    kind: 'digest',
    title: 'Weekly availability summary',
    body: 'Sample digest: the workspace averaged 99.9% uptime last week.',
    at: daysAgo(1.2, DEMO_NOW),
    read: true,
    href: '/app/analytics',
  },
];

export const defaultSettings: DemoSettings = {
  workspaceName: 'Aurora Labs',
  defaultInterval: 5,
  timeDisplay: 'relative',
  density: 'comfortable',
  alerts: { incident: true, degraded: true, recovery: false },
  theme: 'dark',
};

export const DEMO_USER = {
  name: 'Maya Chen',
  role: 'Workspace owner',
  initials: 'MC',
  email: 'maya@aurora.demo',
};
