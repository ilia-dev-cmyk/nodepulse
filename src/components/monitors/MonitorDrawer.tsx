import { useMemo } from 'react';
import { Activity, Copy, ExternalLink, Pause, Play, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { Badge } from '../ui/Badge';
import { DemoNote } from '../ui/DemoNote';
import { LineChart } from '../charts/LineChart';
import { EmptyState } from '../ui/EmptyState';
import { useDemo } from '../../store/DemoDataContext';
import { useToast } from '../../store/ToastContext';
import {
  SEVERITY_META,
  STATUS_META,
  formatInterval,
  formatResponseTime,
  formatTimestamp,
  formatUptime,
} from '../../lib/format';

export function MonitorDrawer({
  monitorId,
  onClose,
  showMonitorsLink = false,
}: {
  monitorId: string | null;
  onClose: () => void;
  showMonitorsLink?: boolean;
}) {
  const { getMonitor, incidents, settings, setMonitorStatus } = useDemo();
  const { showToast } = useToast();
  const monitor = monitorId ? getMonitor(monitorId) : undefined;

  const history = useMemo(() => {
    if (!monitor || monitor.responseHistory.length < 2) return null;
    const values = monitor.responseHistory;
    const now = Date.now();
    const hourFormat = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
    const labels: string[] = [];
    const longLabels: string[] = [];
    values.forEach((_, index) => {
      const date = new Date(now - (values.length - 1 - index) * 3_600_000);
      labels.push(hourFormat.format(date));
      longLabels.push(`${hourFormat.format(date)} UTC`);
    });
    return { values, labels, longLabels };
  }, [monitor]);

  if (!monitor) return null;

  const activeIncident = incidents.find(
    (incident) =>
      incident.status !== 'resolved' && incident.affectedMonitorIds.includes(monitor.id),
  );

  const toggleStatus = () => {
    const nextStatus = monitor.status === 'paused' ? 'healthy' : 'paused';
    setMonitorStatus(monitor.id, nextStatus);
    showToast(
      nextStatus === 'paused'
        ? `Paused ${monitor.name}. Demo checks are not executed either way.`
        : `Resumed ${monitor.name} in the local demo workspace.`,
      'info',
    );
  };

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(monitor.url);
      showToast('Endpoint URL copied to clipboard.', 'success');
    } catch {
      showToast('Clipboard access is unavailable in this browser.', 'error');
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow="Monitor detail"
      title={monitor.name}
      subtitle={
        <span className="drawer__status-line">
          <StatusBadge status={monitor.status} />
          <span className="text-muted">
            {monitor.lastChecked
              ? `Checked ${formatTimestamp(monitor.lastChecked, settings.timeDisplay)}`
              : 'No checks recorded yet'}
          </span>
          {monitor.createdInDemo && <Badge tone="accent">Added this session</Badge>}
        </span>
      }
      footer={
        <div className="drawer__footer-actions">
          {showMonitorsLink && (
            <Link
              to={`/app/monitors?monitor=${encodeURIComponent(monitor.id)}`}
              className="btn btn--ghost btn--md"
              onClick={onClose}
            >
              <ExternalLink size={15} aria-hidden="true" />
              Open in Monitors
            </Link>
          )}
          <Button
            variant={monitor.status === 'paused' ? 'primary' : 'secondary'}
            onClick={toggleStatus}
            iconLeft={
              monitor.status === 'paused' ? (
                <Play size={15} aria-hidden="true" />
              ) : (
                <Pause size={15} aria-hidden="true" />
              )
            }
          >
            {monitor.status === 'paused' ? 'Resume monitoring' : 'Pause monitoring'}
          </Button>
        </div>
      }
    >
      <div className="drawer-section">
        <div className="endpoint-box">
          <div>
            <p className="meta-label">Endpoint</p>
            <p className="endpoint-box__url mono">{monitor.url}</p>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={copyEndpoint}
            aria-label="Copy endpoint URL"
          >
            <Copy size={14} aria-hidden="true" />
          </button>
        </div>
        <p className="drawer-description">{monitor.description}</p>
      </div>

      <div className="drawer-section">
        <div className="stat-grid">
          <div className="stat-tile">
            <p className="meta-label">Uptime (30 days)</p>
            <p className="stat-tile__value">{formatUptime(monitor.uptime)}</p>
          </div>
          <div className="stat-tile">
            <p className="meta-label">Response time</p>
            <p className="stat-tile__value">{formatResponseTime(monitor.responseTime)}</p>
          </div>
          <div className="stat-tile">
            <p className="meta-label">Interval</p>
            <p className="stat-tile__value stat-tile__value--small">
              {formatInterval(monitor.interval)}
            </p>
          </div>
          <div className="stat-tile">
            <p className="meta-label">Region</p>
            <p className="stat-tile__value stat-tile__value--small">
              {monitor.region}
              <span className="stat-tile__sub">{monitor.regionCode}</span>
            </p>
          </div>
        </div>
      </div>

      {activeIncident && (
        <div className="active-incident-box">
          <div className="active-incident-box__head">
            <ShieldAlert size={15} aria-hidden="true" />
            <span>Active incident</span>
            <Badge tone={SEVERITY_META[activeIncident.severity].tone}>
              {SEVERITY_META[activeIncident.severity].label}
            </Badge>
          </div>
          <p className="active-incident-box__title">{activeIncident.title}</p>
          <Link
            to={`/app/incidents?incident=${encodeURIComponent(activeIncident.id)}`}
            className="link active-incident-box__link"
            onClick={onClose}
          >
            Open {activeIncident.id}
          </Link>
        </div>
      )}

      <section className="drawer-section" aria-labelledby="drawer-chart-title">
        <div className="drawer-section__head">
          <h3 className="drawer-section__title" id="drawer-chart-title">
            Response time
          </h3>
          <span className="meta-label">Successful checks · last 24 h</span>
        </div>
        {history ? (
          <LineChart
            labels={history.labels}
            longLabels={history.longLabels}
            series={[
              {
                id: monitor.id,
                label: monitor.name,
                color: 'var(--accent-cyan)',
                points: history.values,
              },
            ]}
            unit="ms"
            height={190}
            showArea
            ariaLabel={`Hourly response time for ${monitor.name} over the last 24 hours.`}
            emptyMessage="No response data recorded."
          />
        ) : (
          <EmptyState
            compact
            icon={Activity}
            title="No response data yet"
            description="Monitors added in this demo start paused and do not generate network checks, so no history exists."
          />
        )}
        <p className="chart-caption">Sample response history generated from local demo data.</p>
      </section>

      <section className="drawer-section" aria-labelledby="drawer-history-title">
        <div className="drawer-section__head">
          <h3 className="drawer-section__title" id="drawer-history-title">
            Status history
          </h3>
        </div>
        {monitor.statusHistory.length ? (
          <ol className="status-history">
            {monitor.statusHistory.map((event) => (
              <li key={`${event.at}-${event.status}`} className="status-history__item">
                <span
                  className={`status-history__dot status-history__dot--${STATUS_META[event.status].tone}`}
                  aria-hidden="true"
                />
                <div className="status-history__copy">
                  <p className="status-history__label">
                    {STATUS_META[event.status].label}
                    {event.note && <span className="status-history__note">{event.note}</span>}
                  </p>
                  <p className="status-history__time">
                    {formatTimestamp(event.at, settings.timeDisplay)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">No status events recorded for this monitor.</p>
        )}
      </section>

      <DemoNote>
        This monitor is part of a fictional demo workspace. Values are seeded sample data — no
        uptime checks are executed and pausing affects only local demo state.
      </DemoNote>
    </Drawer>
  );
}
