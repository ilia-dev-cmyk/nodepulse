import {
  Activity,
  ChartLine,
  LayoutDashboard,
  Search,
  Settings,
  ShieldAlert,
  Timer,
  CircleCheck,
} from 'lucide-react';
import { LogoMark } from '../ui/Logo';
import { MetricCard } from '../ui/MetricCard';
import { StatusBadge } from '../ui/Badge';
import { Sparkline } from '../charts/Sparkline';
import { demoIncidents, demoMonitors } from '../../data/demoData';
import { buildUptimeSeries } from '../../lib/series';
import {
  getActiveIncidents,
  getAverageResponse,
  getMonitorCounts,
} from '../../lib/selectors';
import { formatResponseTime, formatUptime } from '../../lib/format';

const NAV = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Monitors', icon: Activity, active: false },
  { label: 'Incidents', icon: ShieldAlert, active: false },
  { label: 'Analytics', icon: ChartLine, active: false },
  { label: 'Settings', icon: Settings, active: false },
];

const PREVIEW_ROWS = ['core-api', 'checkout-service', 'billing-api'];

export function ProductPreview() {
  const counts = getMonitorCounts(demoMonitors);
  const activeIncidents = getActiveIncidents(demoIncidents);
  const series = buildUptimeSeries(demoMonitors, demoIncidents, '24h');
  const values = series.map((point) => point.value ?? 0);
  const rows = PREVIEW_ROWS.map((id) =>
    demoMonitors.find((monitor) => monitor.id === id),
  ).filter((monitor): monitor is NonNullable<typeof monitor> => Boolean(monitor));
  const average = getAverageResponse(demoMonitors);

  return (
    <figure className="product-preview" aria-label="NodePulse dashboard preview">
      <div className="product-frame" aria-hidden="true">
        <div className="product-frame__chrome">
          <span className="product-frame__dots">
            <span />
            <span />
            <span />
          </span>
          <span className="product-frame__url mono">app.nodepulse.demo/overview</span>
          <span className="preview-tag">SAMPLE DATA</span>
        </div>

        <div className="product-frame__body">
          <aside className="product-frame__sidebar">
            <div className="product-frame__brand">
              <LogoMark size={22} />
              <span>NodePulse</span>
            </div>
            <div className="product-frame__workspace">
              <span className="product-frame__avatar">AL</span>
              <span>
                Aurora Labs
                <small>Portfolio demo</small>
              </span>
            </div>
            <ul className="product-frame__nav">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className={item.active ? 'is-active' : undefined}>
                    <Icon size={15} />
                    {item.label}
                    {item.label === 'Incidents' && (
                      <span className="product-frame__count">{activeIncidents.length}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="product-frame__demo">
              <span className="demo-card__dot" />
              Demo environment
            </div>
          </aside>

          <div className="product-frame__main">
            <div className="product-frame__topbar">
              <span className="product-frame__title">System Overview</span>
              <span className="product-frame__search">
                <Search size={13} />
                Search workspace
                <span className="mono">⌘K</span>
              </span>
              <span className="product-frame__avatar">MC</span>
            </div>

            <div className="product-frame__content">
              <div className="product-frame__metrics">
                <MetricCard
                  label="Total monitors"
                  value={String(counts.all)}
                  icon={Activity}
                  note={`${counts.paused} paused`}
                />
                <MetricCard
                  label="Operational"
                  value={String(counts.healthy)}
                  icon={CircleCheck}
                  note={`${counts.degraded + counts.down} need attention`}
                />
                <MetricCard
                  label="Avg response"
                  value={average === null ? '—' : String(average)}
                  unit="ms"
                  icon={Timer}
                  note="Latest checks"
                />
                <MetricCard
                  label="Active incidents"
                  value={String(activeIncidents.length)}
                  icon={ShieldAlert}
                  note="Sample alerts"
                  tone={activeIncidents.length ? 'down' : 'healthy'}
                />
              </div>

              <div className="product-frame__chart-block">
                <div className="product-frame__chart-head">
                  <span>Uptime</span>
                  <span className="mono">Last 24 hours</span>
                </div>
                <div className="preview-area-chart">
                  <span className="preview-area-chart__grid" aria-hidden="true" />
                  <Sparkline values={values} tone="cyan" width={640} height={92} fluid />
                </div>
                <div className="preview-area-chart__axis mono">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>Now</span>
                </div>
              </div>

              <div className="product-frame__list">
                <div className="product-frame__list-head">
                  <span>Status</span>
                  <span>Monitor</span>
                  <span>Uptime</span>
                  <span>Response</span>
                </div>
                {rows.map((monitor) => (
                  <div key={monitor.id} className="product-frame__row">
                    <StatusBadge status={monitor.status} />
                    <span className="product-frame__row-name">
                      {monitor.name}
                      <small className="mono">{monitor.url.replace('https://', '')}</small>
                    </span>
                    <span className="mono">{formatUptime(monitor.uptime)}</span>
                    <span className="mono">{formatResponseTime(monitor.responseTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption>
        Dashboard preview composed from the live demo's components. Every value is fictional sample
        data.
      </figcaption>
    </figure>
  );
}
