import { LogoMark } from '../ui/Logo';
import { Sparkline } from '../charts/Sparkline';
import { demoIncidents, demoMonitors } from '../../data/demoData';
import { buildUptimeSeries } from '../../lib/series';
import { getFleetUptime, getMonitorCounts } from '../../lib/selectors';
import { formatResponseTime } from '../../lib/format';

const PREVIEW_MONITORS = ['core-api', 'checkout-service', 'billing-api', 'authentication'];

const TONE_DOT = {
  healthy: 'var(--status-healthy)',
  degraded: 'var(--status-warning)',
  down: 'var(--status-down)',
  paused: 'var(--text-muted)',
} as const;

export function HeroPreview() {
  const counts = getMonitorCounts(demoMonitors);
  const uptime = getFleetUptime(demoMonitors);
  const series = buildUptimeSeries(demoMonitors, demoIncidents, '24h');
  const values = series.map((point) => point.value ?? 0);
  const monitors = PREVIEW_MONITORS.map((id) =>
    demoMonitors.find((monitor) => monitor.id === id),
  ).filter((monitor): monitor is NonNullable<typeof monitor> => Boolean(monitor));

  return (
    <div className="hero-preview">
      <div className="hero-preview__frame" aria-hidden="true">
        <div className="hero-preview__topbar">
          <span className="hero-preview__brand">
            <LogoMark size={20} />
            <span>NodePulse</span>
          </span>
          <span className="preview-tag">DEMO DATA</span>
        </div>

        <div className="hero-preview__summary">
          <div>
            <p className="meta-label">Fleet health</p>
            <p className="hero-preview__uptime">
              {uptime === null ? '—' : `${uptime.toFixed(2)}%`}
            </p>
            <p className="hero-preview__sub">30-day sample uptime</p>
          </div>
          <div className="hero-preview__counts">
            <span className="count-pill count-pill--healthy">
              <span aria-hidden="true" />
              {counts.healthy} operational
            </span>
            <span className="count-pill count-pill--warning">
              <span aria-hidden="true" />
              {counts.degraded} degraded
            </span>
            <span className="count-pill count-pill--down">
              <span aria-hidden="true" />
              {counts.down} down
            </span>
          </div>
        </div>

        <div className="hero-preview__chart">
          <div className="hero-preview__chart-head">
            <span>Uptime trend</span>
            <span className="mono">24h</span>
          </div>
          <Sparkline values={values} tone="cyan" width={360} height={56} fluid />
          <div className="hero-preview__chart-axis mono" aria-hidden="true">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </div>

        <ul className="hero-preview__services">
          {monitors.map((monitor) => (
            <li key={monitor.id} className="hero-preview__service">
              <span
                className="status-dot"
                style={{ background: TONE_DOT[monitor.status] }}
                aria-hidden="true"
              />
              <span className="hero-preview__service-name">{monitor.name}</span>
              <span className="hero-preview__service-url mono">{monitor.url.replace('https://', '')}</span>
              <span className="hero-preview__service-value mono">
                {formatResponseTime(monitor.responseTime)}
              </span>
            </li>
          ))}
        </ul>

        <div className="hero-preview__footer">
          <span>Aurora Labs · demo workspace</span>
          <span className="mono">12 monitors</span>
        </div>
      </div>

      <p className="hero-preview__caption">
        Illustration built from the demo dashboard's real components and sample dataset.
      </p>
    </div>
  );
}
