import { useMemo, useState } from 'react';
import { Activity, ChartLine, MapPin, ShieldAlert, Timer, Waves } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { LineChart } from '../components/charts/LineChart';
import { DonutChart } from '../components/charts/DonutChart';
import { EmptyState } from '../components/ui/EmptyState';
import { DemoNote } from '../components/ui/DemoNote';
import { useDemo } from '../store/DemoDataContext';
import {
  getAverageResponse,
  getFleetUptime,
  getMonitorCounts,
} from '../lib/selectors';
import {
  RANGES,
  RANGE_CONFIG,
  buildAggregateResponseSeries,
  buildComparisonSeries,
  buildUptimeSeries,
  getRegionStats,
  rangeStart,
} from '../lib/series';
import {
  STATUS_META,
  formatShortDateTime,
  formatUptime,
} from '../lib/format';
import type { Monitor, TimeRange } from '../data/types';
import { cn } from '../lib/cn';

const COMPARISON_COLORS = [
  'var(--accent-cyan)',
  'var(--accent-purple)',
  'var(--status-warning)',
  'var(--status-info)',
];

const DEFAULT_COMPARISON = ['checkout-service', 'core-api', 'data-ingestion'];

function seriesAverage(values: (number | null)[]): number | null {
  const numeric = values.filter((value): value is number => value !== null);
  if (!numeric.length) return null;
  return Math.round(numeric.reduce((total, value) => total + value, 0) / numeric.length);
}

export function AnalyticsPage() {
  const { monitors, incidents } = useDemo();
  const [range, setRange] = useState<TimeRange>('7d');
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_COMPARISON);

  const counts = getMonitorCounts(monitors);
  const fleetUptime = getFleetUptime(monitors);
  const averageResponse = getAverageResponse(monitors);
  const activeMonitors = monitors.filter((monitor) => monitor.status !== 'paused');
  const regions = useMemo(() => getRegionStats(monitors), [monitors]);

  const uptimeSeries = useMemo(
    () => buildUptimeSeries(monitors, incidents, range),
    [monitors, incidents, range],
  );
  const responseSeries = useMemo(
    () => buildAggregateResponseSeries(monitors, incidents, range),
    [monitors, incidents, range],
  );
  const selectedMonitors = selectedIds
    .map((id) => monitors.find((monitor) => monitor.id === id))
    .filter((monitor): monitor is NonNullable<typeof monitor> => Boolean(monitor));
  const comparison = useMemo(
    () => buildComparisonSeries(selectedMonitors, incidents, range),
    [selectedMonitors, incidents, range],
  );

  const incidentsInRange = incidents.filter(
    (incident) => new Date(incident.startedAt).getTime() >= rangeStart(range).getTime(),
  ).length;

  const statusSlices = [
    {
      id: 'healthy',
      label: STATUS_META.healthy.label,
      value: counts.healthy,
      color: 'var(--status-healthy)',
    },
    {
      id: 'degraded',
      label: STATUS_META.degraded.label,
      value: counts.degraded,
      color: 'var(--status-warning)',
    },
    {
      id: 'down',
      label: STATUS_META.down.label,
      value: counts.down,
      color: 'var(--status-down)',
    },
    {
      id: 'paused',
      label: STATUS_META.paused.label,
      value: counts.paused,
      color: 'var(--text-muted)',
    },
  ];

  const comparisonStats: { monitor: Monitor; average: number }[] = [];
  for (const entry of comparison) {
    const average = seriesAverage(entry.values);
    if (average !== null) comparisonStats.push({ monitor: entry.monitor, average });
  }
  comparisonStats.sort((a, b) => a.average - b.average);

  const toggleComparison = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id);
      }
      if (current.length >= 4) return current;
      return [...current, id];
    });
  };

  const labels = responseSeries.map((point) => point.label);
  const longLabels = responseSeries.map((point) => formatShortDateTime(point.at));
  const regionMax = Math.max(...regions.map((region) => region.averageResponse ?? 0), 1);

  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        description="Explore latency and availability trends derived from this workspace's sample monitors."
        meta={<Badge tone="neutral">Computed locally</Badge>}
        actions={
          <div className="range-control">
            <span className="range-control__label">Range</span>
            <SegmentedControl
              size="sm"
              ariaLabel="Analytics time range"
              value={range}
              onChange={setRange}
              options={RANGES.map((value) => ({ value, label: RANGE_CONFIG[value].short }))}
            />
          </div>
        }
      />

      <div className="analytics-kpis">
        <div className="analytics-kpi">
          <span className="analytics-kpi__icon" aria-hidden="true">
            <Activity size={14} />
          </span>
          <p className="meta-label">Fleet uptime (30 days)</p>
          <p className="analytics-kpi__value">{formatUptime(fleetUptime)}</p>
          <p className="analytics-kpi__note">{activeMonitors.length} active monitors</p>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi__icon" aria-hidden="true">
            <Timer size={14} />
          </span>
          <p className="meta-label">Average response</p>
          <p className="analytics-kpi__value">
            {averageResponse === null ? '—' : `${averageResponse} ms`}
          </p>
          <p className="analytics-kpi__note">Latest successful checks</p>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi__icon" aria-hidden="true">
            <ChartLine size={14} />
          </span>
          <p className="meta-label">Monitored endpoints</p>
          <p className="analytics-kpi__value">{counts.all}</p>
          <p className="analytics-kpi__note">Across {regions.length} probe regions</p>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi__icon" aria-hidden="true">
            <ShieldAlert size={14} />
          </span>
          <p className="meta-label">Incidents in range</p>
          <p className="analytics-kpi__value">{incidentsInRange}</p>
          <p className="analytics-kpi__note">{RANGE_CONFIG[range].label}</p>
        </div>
      </div>

      <div className="analytics-grid">
        <Card className="analytics-grid__response">
          <CardHeader
            title="Response time trend"
            description={`${RANGE_CONFIG[range].label} · mean across responding monitors`}
            actions={<span className="chart-unit">milliseconds</span>}
          />
          <LineChart
            labels={labels}
            longLabels={longLabels}
            series={[
              {
                id: 'response',
                label: 'Average response time',
                color: 'var(--accent-purple)',
                points: responseSeries.map((point) => point.value),
              },
            ]}
            unit="ms"
            height={272}
            showArea
            ariaLabel={`Average response time trend for the ${RANGE_CONFIG[range].label.toLowerCase()}.`}
            emptyMessage="No responsive monitors in this range. Resume or add a monitor to populate this chart."
          />
          <p className="chart-caption">
            Buckets follow the selected range and are averaged from each monitor's sample latency.
            Spikes align with logged demo incidents.
          </p>
        </Card>

        <Card className="analytics-grid__status">
          <CardHeader title="Status distribution" description="Current state of every monitor" />
          <div className="status-distribution">
            <DonutChart
              slices={statusSlices}
              centerValue={String(counts.all)}
              centerLabel="monitors"
              ariaLabel="Monitor status distribution"
            />
            <ul className="status-legend">
              {statusSlices.map((slice) => (
                <li key={slice.id} className="status-legend__row">
                  <span
                    className="legend-swatch"
                    style={{ background: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="status-legend__label">{slice.label}</span>
                  <span className="status-legend__value">{slice.value}</span>
                  <span className="status-legend__pct">
                    {counts.all ? Math.round((slice.value / counts.all) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="chart-caption">Reflects the current demo dataset, not the time range.</p>
        </Card>

        <Card className="analytics-grid__uptime">
          <CardHeader
            title="Uptime trend"
            description={`${RANGE_CONFIG[range].label} · aggregate availability`}
            actions={<span className="chart-unit">percent</span>}
          />
          <LineChart
            labels={uptimeSeries.map((point) => point.label)}
            longLabels={uptimeSeries.map((point) => formatShortDateTime(point.at))}
            series={[
              {
                id: 'uptime',
                label: 'Fleet uptime',
                color: 'var(--accent-cyan)',
                points: uptimeSeries.map((point) => point.value),
              },
            ]}
            unit="%"
            height={230}
            showArea
            ariaLabel={`Fleet uptime trend for the ${RANGE_CONFIG[range].label.toLowerCase()}.`}
            emptyMessage="No active monitors to chart for this range."
          />
          <p className="chart-caption">
            Dips correspond to incidents that started in the bucket. Values are sample data.
          </p>
        </Card>

        <Card className="analytics-grid__regions">
          <CardHeader
            title="Regional performance"
            description="Sample probe locations"
            actions={<MapPin size={15} aria-hidden="true" className="card-header__icon" />}
          />
          {regions.length ? (
            <div className="region-table-wrap">
              <table className="data-table region-table">
                <caption className="sr-only">
                  Average response time and uptime by monitoring region.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Region</th>
                    <th scope="col" className="col-num">
                      Monitors
                    </th>
                    <th scope="col">Avg response</th>
                    <th scope="col" className="col-num">
                      Uptime
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region) => (
                    <tr key={region.region}>
                      <td data-label="Region">
                        <span className="region-cell">
                          {region.region}
                          <span className="region-cell__code">{region.code}</span>
                        </span>
                      </td>
                      <td data-label="Monitors" className="cell-num">
                        {region.monitorCount}
                      </td>
                      <td data-label="Avg response">
                        <div className="mini-bar-row">
                          <span className="mini-bar" aria-hidden="true">
                            <span
                              style={{
                                width: `${Math.max(
                                  6,
                                  ((region.averageResponse ?? 0) / regionMax) * 100,
                                )}%`,
                              }}
                            />
                          </span>
                          <span className="mono mini-bar-row__value">
                            {region.averageResponse === null ? '—' : `${region.averageResponse} ms`}
                          </span>
                        </div>
                      </td>
                      <td data-label="Uptime" className="cell-num">
                        {formatUptime(region.averageUptime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              compact
              icon={MapPin}
              title="No regions to compare"
              description="Resume or add a monitor to populate regional performance."
            />
          )}
          <p className="chart-caption">
            Regional figures combine every monitor assigned to that probe location.
          </p>
        </Card>

        <Card className="analytics-grid__compare">
          <CardHeader
            title="Monitor comparison"
            description="Compare sample response trends for up to four monitors"
            actions={
              <span className="compare-toolbar">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelectedIds(DEFAULT_COMPARISON)}
                >
                  Reset selection
                </button>
                <span className="meta-label">{selectedIds.length}/4 selected</span>
              </span>
            }
          />
          <div className="compare-chips" role="group" aria-label="Choose monitors to compare">
            {monitors.map((monitor) => {
              const selected = selectedIds.includes(monitor.id);
              const index = selectedIds.indexOf(monitor.id);
              return (
                <button
                  key={monitor.id}
                  type="button"
                  className={cn('compare-chip', selected && 'is-selected')}
                  aria-pressed={selected}
                  onClick={() => toggleComparison(monitor.id)}
                  disabled={!selected && selectedIds.length >= 4}
                  title={
                    !selected && selectedIds.length >= 4
                      ? 'Compare up to four monitors'
                      : `Compare ${monitor.name}`
                  }
                >
                  <span
                    className="compare-chip__dot"
                    aria-hidden="true"
                    style={{
                      background: selected
                        ? COMPARISON_COLORS[index % COMPARISON_COLORS.length]
                        : 'var(--text-muted)',
                    }}
                  />
                  {monitor.name}
                </button>
              );
            })}
          </div>

          {comparison.length ? (
            <>
              <div className="series-legend" aria-hidden="true">
                {comparison.map((entry, index) => (
                  <span className="series-legend__item" key={entry.monitor.id}>
                    <span
                      className="legend-swatch"
                      style={{ background: COMPARISON_COLORS[index % COMPARISON_COLORS.length] }}
                    />
                    {entry.monitor.name}
                  </span>
                ))}
              </div>
              <LineChart
                labels={labels}
                longLabels={longLabels}
                series={comparison.map((entry, index) => ({
                  id: entry.monitor.id,
                  label: entry.monitor.name,
                  color: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
                  points: entry.values,
                  dashed: entry.monitor.status === 'paused',
                }))}
                unit="ms"
                height={280}
                ariaLabel="Response time comparison for the selected monitors."
                emptyMessage="No response data for the selected monitors in this range."
              />
              <div className="compare-insights">
                {comparisonStats.length > 0 ? (
                  <>
                    <span>
                      Fastest in range: <strong>{comparisonStats[0].monitor.name}</strong> ·{' '}
                      {comparisonStats[0].average} ms
                    </span>
                    {comparisonStats.length > 1 && (
                      <span>
                        Slowest in range:{' '}
                        <strong>{comparisonStats[comparisonStats.length - 1].monitor.name}</strong> ·{' '}
                        {comparisonStats[comparisonStats.length - 1].average} ms
                      </span>
                    )}
                  </>
                ) : (
                  <span>No comparable response data for the selected monitors.</span>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              compact
              icon={Waves}
              title="Nothing selected"
              description="Select at least one monitor above to draw a comparison chart."
            />
          )}
        </Card>
      </div>

      <DemoNote>
        Analytics are computed in the browser from the shared demo dataset. No analytics service,
        external API, or historical production data is involved.
      </DemoNote>
    </div>
  );
}
