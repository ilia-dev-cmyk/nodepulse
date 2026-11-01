import {
  Activity,
  ArrowRight,
  ChartLine,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../ui/Badge';
import { Sparkline } from '../charts/Sparkline';
import { demoIncidents, demoMonitors } from '../../data/demoData';
import { buildMonitorResponseSeries } from '../../lib/series';

const UPTIME_ROWS = ['core-api', 'checkout-service', 'billing-api'];

export function FeatureSection() {
  const rows = UPTIME_ROWS.map((id) =>
    demoMonitors.find((monitor) => monitor.id === id),
  ).filter((monitor): monitor is NonNullable<typeof monitor> => Boolean(monitor));

  const latencyMonitors = ['core-api', 'checkout-service', 'image-cdn'];
  const latency = latencyMonitors
    .map((id) => demoMonitors.find((monitor) => monitor.id === id))
    .filter((monitor): monitor is NonNullable<typeof monitor> => Boolean(monitor));

  const checkout = demoMonitors.find((monitor) => monitor.id === 'checkout-service');
  const responseSeries = checkout
    ? buildMonitorResponseSeries(checkout, demoIncidents, '24h').filter(
        (value): value is number => value !== null,
      )
    : [];

  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Capabilities</p>
          <h2 className="section-heading__title">Everything you need to read service health.</h2>
          <p className="section-heading__copy">
            Three connected surfaces for availability, incidents, and performance — all driven by the
            same sample dataset.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card feature-card--large">
            <span className="feature-card__icon" aria-hidden="true">
              <Activity size={18} />
            </span>
            <h3 className="feature-card__title">Uptime Monitoring</h3>
            <p className="feature-card__copy">
              Understand which services are healthy, degraded, or unavailable. Status history and
              uptime percentages update with the monitor dataset.
            </p>

            <div className="feature-visual feature-visual--uptime" aria-hidden="true">
              <div className="feature-visual__head">
                <span>Monitors</span>
                <span className="mono">30-day uptime</span>
              </div>
              {rows.map((monitor) => (
                <div className="feature-visual__row" key={monitor.id}>
                  <StatusBadge status={monitor.status} />
                  <span className="feature-visual__name">{monitor.name}</span>
                  <span className="feature-visual__uptime mono">
                    {monitor.uptime === null ? '—' : `${monitor.uptime.toFixed(2)}%`}
                  </span>
                </div>
              ))}
              <div className="feature-visual__spark">
                <Sparkline values={[62, 58, 64, 60, 72, 68, 74, 70, 66, 71, 76, 72]} height={34} width={280} fluid />
              </div>
            </div>

            <Link to="/app/monitors" className="feature-card__link">
              Explore monitors
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </article>

          <article className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              <ShieldAlert size={18} />
            </span>
            <h3 className="feature-card__title">Incident Management</h3>
            <p className="feature-card__copy">
              Track service disruptions, investigate timelines, and keep incident information
              organized from detection to resolution.
            </p>

            <div className="feature-visual feature-visual--timeline" aria-hidden="true">
              {demoIncidents
                .filter((incident) => incident.status !== 'resolved')
                .slice(0, 2)
                .map((incident) => (
                  <div className="mini-incident" key={incident.id}>
                    <div className="mini-incident__top">
                      <span className={`mini-incident__dot mini-incident__dot--${incident.severity}`} />
                      <span className="mini-incident__id mono">{incident.id}</span>
                      <span className="mini-incident__state">{incident.status}</span>
                    </div>
                    <p className="mini-incident__title">{incident.title}</p>
                    <div className="mini-incident__rail">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ))}
            </div>

            <Link to="/app/incidents" className="feature-card__link">
              Explore incidents
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </article>

          <article className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              <ChartLine size={18} />
            </span>
            <h3 className="feature-card__title">Latency Analytics</h3>
            <p className="feature-card__copy">
              Identify response-time changes and compare performance across time ranges, monitors,
              and probe regions.
            </p>

            <div className="feature-visual feature-visual--bars" aria-hidden="true">
              <div className="feature-bars">
                <span className="feature-bars__grid" />
                <Sparkline values={responseSeries.length ? responseSeries : [1]} tone="purple" width={300} height={76} fluid />
              </div>
              <div className="feature-bars__labels">
                {latency.map((monitor) => (
                  <span key={monitor.id} className="feature-bars__label">
                    <span className="mono">
                      {monitor.responseTime === null ? '—' : `${monitor.responseTime} ms`}
                    </span>
                    {monitor.name}
                  </span>
                ))}
              </div>
            </div>

            <Link to="/app/analytics" className="feature-card__link">
              Explore analytics
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </article>
        </div>

        <ul className="feature-footnotes">
          <li>
            <Check size={13} aria-hidden="true" />
            Keyboard-accessible charts
          </li>
          <li>
            <Check size={13} aria-hidden="true" />
            Searchable, filterable tables
          </li>
          <li>
            <Check size={13} aria-hidden="true" />
            Deep-linkable monitor and incident views
          </li>
          <li>
            <Check size={13} aria-hidden="true" />
            Deterministic sample data
          </li>
        </ul>
      </div>
    </section>
  );
}
