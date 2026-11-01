import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ChartLine,
  CircleCheck,
  CircleSlash,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { MonitorTable } from '../components/monitors/MonitorTable';
import { MonitorDrawer } from '../components/monitors/MonitorDrawer';
import { LineChart } from '../components/charts/LineChart';
import { StatusDotGrid, Sparkline } from '../components/charts/Sparkline';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { ButtonLink } from '../components/ui/Button';
import { DemoNote } from '../components/ui/DemoNote';
import { useDemo } from '../store/DemoDataContext';
import { useDrawerParam } from '../hooks/useDrawerParam';
import { useToast } from '../store/ToastContext';
import { sortMonitorsByAttention } from '../lib/selectors';
import {
  getActiveIncidents,
  getAverageResponse,
  getFleetUptime,
  getMonitorCounts,
} from '../lib/selectors';
import {
  RANGES,
  RANGE_CONFIG,
  buildAggregateResponseSeries,
  buildUptimeSeries,
  getRegionStats,
} from '../lib/series';
import {
  INCIDENT_STATUS_META,
  SEVERITY_META,
  formatShortDateTime,
  formatTimestamp,
  formatUptime,
} from '../lib/format';
import type { Monitor, TimeRange } from '../data/types';

export function OverviewPage() {
  const { monitors, incidents, settings, setMonitorStatus } = useDemo();
  const { showToast } = useToast();
  const [range, setRange] = useState<TimeRange>('24h');
  const drawer = useDrawerParam('monitor');

  const counts = useMemo(() => getMonitorCounts(monitors), [monitors]);
  const activeIncidents = useMemo(() => getActiveIncidents(incidents), [incidents]);
  const averageResponse = getAverageResponse(monitors);
  const fleetUptime = getFleetUptime(monitors);
  const regions = useMemo(() => getRegionStats(monitors), [monitors]);
  const activeMonitorCount = counts.all - counts.paused;

  const uptimeSeries = useMemo(
    () => buildUptimeSeries(monitors, incidents, range),
    [monitors, incidents, range],
  );
  const responseSeries = useMemo(
    () => buildAggregateResponseSeries(monitors, incidents, range),
    [monitors, incidents, range],
  );

  const uptimeValues = uptimeSeries
    .map((point) => point.value)
    .filter((value): value is number => value !== null);
  const uptimeAverage = uptimeValues.length
    ? uptimeValues.reduce((total, value) => total + value, 0) / uptimeValues.length
    : null;
  const lowestIndex = uptimeValues.length
    ? uptimeSeries.reduce(
        (lowest, point, index) =>
          point.value !== null && point.value < (uptimeSeries[lowest].value ?? Infinity)
            ? index
            : lowest,
        0,
      )
    : null;
  const responseValues = responseSeries
    .map((point) => point.value)
    .filter((value): value is number => value !== null);
  const responseAverage = responseValues.length
    ? Math.round(responseValues.reduce((total, value) => total + value, 0) / responseValues.length)
    : null;

  const monitored = sortMonitorsByAttention(monitors).slice(0, 6);
  const incidentSeverity = {
    critical: activeIncidents.filter((incident) => incident.severity === 'critical').length,
    major: activeIncidents.filter((incident) => incident.severity === 'major').length,
    minor: activeIncidents.filter((incident) => incident.severity === 'minor').length,
  };

  const handleToggle = (monitor: Monitor) => {
    const nextStatus = monitor.status === 'paused' ? 'healthy' : 'paused';
    setMonitorStatus(monitor.id, nextStatus);
    showToast(
      nextStatus === 'paused'
        ? `Paused ${monitor.name} in the demo workspace.`
        : `Resumed ${monitor.name} in the demo workspace.`,
      'info',
    );
  };

  const regionMax = Math.max(...regions.map((region) => region.averageResponse ?? 0), 1);

  return (
    <div className="page">
      <PageHeader
        title="System Overview"
        description="Monitor service health and investigate changes across your workspace."
        meta={<Badge tone="neutral">Sample data</Badge>}
        actions={
          <div className="page-actions">
            <div className="range-control">
              <span className="range-control__label">Range</span>
              <SegmentedControl
                size="sm"
                ariaLabel="Chart time range"
                value={range}
                onChange={setRange}
                options={RANGES.map((value) => ({
                  value,
                  label: RANGE_CONFIG[value].short,
                }))}
              />
            </div>
            <ButtonLink
              to="/app/analytics"
              variant="secondary"
              size="sm"
              iconLeft={<ChartLine size={15} aria-hidden="true" />}
            >
              Analytics
            </ButtonLink>
          </div>
        }
      />

      <div className="metrics-grid">
        <MetricCard
          label="Total monitors"
          value={String(counts.all)}
          icon={Activity}
          note={`Across ${regions.length} probe regions · ${counts.paused} paused`}
          visual={<StatusDotGrid statuses={monitors.map((monitor) => monitor.status)} max={16} />}
        />
        <MetricCard
          label="Operational"
          value={String(counts.healthy)}
          icon={CircleCheck}
          tone={counts.healthy === counts.all ? 'healthy' : 'default'}
          note={`${formatUptime(fleetUptime)} fleet uptime · ${
            counts.degraded + counts.down
          } need attention`}
        />
        <MetricCard
          label="Average response"
          value={averageResponse === null ? '—' : String(averageResponse)}
          unit={averageResponse === null ? undefined : 'ms'}
          icon={Timer}
          note="Latest successful checks · excludes paused and unreachable"
          visual={<Sparkline values={responseValues} width={92} height={32} />}
        />
        <MetricCard
          label="Active incidents"
          value={String(activeIncidents.length)}
          icon={ShieldAlert}
          tone={activeIncidents.length ? 'down' : 'healthy'}
          note={
            activeIncidents.length
              ? `${incidentSeverity.critical} critical · ${incidentSeverity.major} major`
              : 'No open incidents in the demo workspace'
          }
          visual={
            <div className="severity-ticks" aria-hidden="true">
              {(['critical', 'major', 'minor'] as const).map((severity) => (
                <span
                  key={severity}
                  className={`severity-ticks__bar severity-ticks__bar--${severity}`}
                  style={{ height: `${18 + incidentSeverity[severity] * 8}px` }}
                />
              ))}
            </div>
          }
        />
      </div>

      <DemoNote>
        Figures on this page are computed from the fictional monitors and incidents in this demo
        workspace. Uptime and latency charts are derived from that same local dataset.
      </DemoNote>

      <div className="overview-grid">
        <Card className="overview-chart-card">
          <CardHeader
            title="Uptime"
            description={`${RANGE_CONFIG[range].label} · aggregate availability across ${activeMonitorCount} active monitors`}
            actions={
              <div className="chart-kpi">
                <span className="chart-kpi__label">Fleet uptime</span>
                <span className="chart-kpi__value">{formatUptime(fleetUptime)}</span>
              </div>
            }
          />
          <LineChart
            labels={uptimeSeries.map((point) => point.label)}
            longLabels={uptimeSeries.map((point) => formatShortDateTime(point.at))}
            series={[
              {
                id: 'uptime',
                label: 'Uptime',
                color: 'var(--accent-cyan)',
                points: uptimeSeries.map((point) => point.value),
              },
            ]}
            unit="%"
            height={288}
            showArea
            ariaLabel={`Uptime percentage chart for the ${RANGE_CONFIG[range].label.toLowerCase()}.`}
            emptyMessage="No active monitors in this range. Resume a monitor to include it in the uptime chart."
          />
          <div className="chart-foot">
            <span className="chart-foot__legend">
              <span className="legend-swatch legend-swatch--cyan" aria-hidden="true" />
              {uptimeAverage !== null ? `Range average ${uptimeAverage.toFixed(2)}%` : 'No data'}
            </span>
            {lowestIndex !== null && uptimeValues.length > 1 && (
              <span className="chart-foot__meta">
                Lowest {uptimeSeries[lowestIndex].value?.toFixed(2)}% at{' '}
                {formatShortDateTime(uptimeSeries[lowestIndex].at)}
              </span>
            )}
            <span className="chart-foot__meta chart-foot__meta--end">Sample data</span>
          </div>
        </Card>

        <Card className="overview-incident-card" padded={false}>
          <div className="overview-incident-card__head">
            <CardHeader
              title="Active incidents"
              description={`${activeIncidents.length} open · ${
                incidents.length - activeIncidents.length
              } resolved`}
              actions={
                <Link to="/app/incidents" className="card-link">
                  View all
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              }
            />
          </div>
          {activeIncidents.length ? (
            <ul className="incident-mini-list">
              {activeIncidents.map((incident) => {
                const affected = incident.affectedMonitorIds
                  .map((id) => monitors.find((monitor) => monitor.id === id)?.name)
                  .filter(Boolean)
                  .join(', ');
                const statusMeta = INCIDENT_STATUS_META[incident.status];
                return (
                  <li key={incident.id}>
                    <Link
                      to={`/app/incidents?incident=${encodeURIComponent(incident.id)}`}
                      className="incident-mini"
                    >
                      <span className="incident-mini__top">
                        <Badge tone={SEVERITY_META[incident.severity].tone} withDot>
                          {SEVERITY_META[incident.severity].label}
                        </Badge>
                        <span className="incident-mini__id mono">{incident.id}</span>
                        <span className={`incident-state incident-state--${statusMeta.tone}`}>
                          <span className="incident-state__dot" aria-hidden="true" />
                          {statusMeta.label}
                        </span>
                      </span>
                      <span className="incident-mini__title">{incident.title}</span>
                      <span className="incident-mini__meta">
                        {affected || 'No monitors linked'} · Started{' '}
                        {formatTimestamp(incident.startedAt, settings.timeDisplay)}
                      </span>
                      <span className="incident-mini__cta">
                        Open incident
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="No active incidents"
              description="Every incident in this demo workspace has been resolved."
            />
          )}
          <div className="overview-incident-card__foot">
            <span className="meta-label">Resolved incident history is available in Incidents.</span>
          </div>
        </Card>
      </div>

      <div className="overview-grid overview-grid--secondary">
        <Card>
          <CardHeader
            title="Response time"
            description={`${RANGE_CONFIG[range].label} · mean across responding monitors`}
            actions={
              <div className="chart-kpi">
                <span className="chart-kpi__label">Average</span>
                <span className="chart-kpi__value chart-kpi__value--sm">
                  {responseAverage === null ? '—' : `${responseAverage} ms`}
                </span>
              </div>
            }
          />
          <LineChart
            labels={responseSeries.map((point) => point.label)}
            longLabels={responseSeries.map((point) => formatShortDateTime(point.at))}
            series={[
              {
                id: 'response',
                label: 'Average response time',
                color: 'var(--accent-purple)',
                points: responseSeries.map((point) => point.value),
              },
            ]}
            unit="ms"
            height={218}
            ariaLabel={`Average response time chart for the ${RANGE_CONFIG[range].label.toLowerCase()}.`}
            emptyMessage="No responsive monitors in this range. Paused monitors are excluded."
          />
          <p className="chart-caption">
            Excludes paused monitors and intervals without a successful check.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Regional latency"
            description="Mean latest response time by probe location"
            actions={
              <Link to="/app/analytics" className="card-link">
                Compare
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
          />
          {regions.length ? (
            <ul className="region-list">
              {regions.map((region) => (
                <li className="region-row" key={region.region}>
                  <div className="region-row__head">
                    <span className="region-row__name">
                      <MapPin size={13} aria-hidden="true" />
                      {region.region}
                    </span>
                    <span className="region-row__value mono">
                      {region.averageResponse === null ? '—' : `${region.averageResponse} ms`}
                    </span>
                  </div>
                  <div className="region-row__bar" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.max(
                          6,
                          ((region.averageResponse ?? 0) / regionMax) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="region-row__meta">
                    {region.monitorCount} monitor{region.monitorCount === 1 ? '' : 's'} ·{' '}
                    {formatUptime(region.averageUptime)} uptime ·{' '}
                    <span className={region.healthyCount === region.monitorCount ? 'text-healthy' : 'text-warning'}>
                      {region.healthyCount === region.monitorCount
                        ? 'all operational'
                        : `${region.monitorCount - region.healthyCount} need attention`}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={CircleSlash}
              title="No regional data"
              description="Add or resume a monitor to see regional performance."
            />
          )}
        </Card>
      </div>

      <Card padded={false} className="overview-table-card">
        <div className="overview-table-card__head">
          <CardHeader
            title="Monitors"
            description={`${counts.all} total · showing the ${monitored.length} that need attention first`}
            actions={
              <Link to="/app/monitors" className="card-link">
                View all monitors
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
          />
        </div>
        <MonitorTable
          monitors={monitored}
          timeDisplay={settings.timeDisplay}
          onSelect={drawer.open}
          onToggleStatus={handleToggle}
        />
        <div className="overview-table-card__foot">
          <span className="meta-label">
            Row actions are local demo changes · {counts.degraded + counts.down} monitors need
            attention
          </span>
          <Link to="/app/monitors" className="card-link">
            Manage monitors
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </Card>

      <MonitorDrawer monitorId={drawer.value} onClose={drawer.close} showMonitorsLink />
    </div>
  );
}
