import { useMemo, useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/SearchInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState } from '../components/ui/EmptyState';
import { DemoNote } from '../components/ui/DemoNote';
import { MonitorTable } from '../components/monitors/MonitorTable';
import { MonitorDrawer } from '../components/monitors/MonitorDrawer';
import { AddMonitorDialog } from '../components/monitors/AddMonitorDialog';
import { useDemo } from '../store/DemoDataContext';
import { useToast } from '../store/ToastContext';
import { useDrawerParam } from '../hooks/useDrawerParam';
import { getMonitorCounts } from '../lib/selectors';
import { SORT_OPTIONS, sortMonitors, type MonitorSortPreset } from '../lib/sorting';
import type { Monitor, MonitorStatus } from '../data/types';

type StatusFilter = 'all' | MonitorStatus;

export function MonitorsPage() {
  const { monitors, settings, setMonitorStatus } = useDemo();
  const { showToast } = useToast();
  const drawer = useDrawerParam('monitor');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<MonitorSortPreset>('attention');
  const [addOpen, setAddOpen] = useState(false);

  const counts = getMonitorCounts(monitors);
  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const matched = monitors.filter((monitor) => {
      const matchesStatus = filter === 'all' || monitor.status === filter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return [monitor.name, monitor.url, monitor.region, monitor.regionCode, monitor.id]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
    return sortMonitors(matched, sort);
  }, [monitors, filter, query, sort]);

  const filtersActive = filter !== 'all' || query.length > 0;
  const clearFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const handleToggle = (monitor: Monitor) => {
    const nextStatus = monitor.status === 'paused' ? 'healthy' : 'paused';
    setMonitorStatus(monitor.id, nextStatus);
    showToast(
      nextStatus === 'paused'
        ? `Paused ${monitor.name}. It stays in the workspace but is excluded from uptime charts.`
        : `Resumed ${monitor.name} in the local demo workspace.`,
      'info',
    );
  };

  const handleAdded = (monitor: Monitor) => {
    setSearch('');
    setFilter('all');
    setSort('attention');
    drawer.open(monitor.id);
  };

  return (
    <div className="page">
      <PageHeader
        title="Monitors"
        description="Manage the endpoints this demo workspace checks, review sample response history, and pause records locally."
        meta={<Badge tone="neutral">{counts.all} monitors</Badge>}
        actions={
          <Button
            variant="primary"
            iconLeft={<Plus size={16} aria-hidden="true" />}
            onClick={() => setAddOpen(true)}
          >
            Add monitor
          </Button>
        }
      />

      <Card padded={false} className="monitors-panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            label="Search monitors"
            placeholder="Search name, endpoint, or region…"
            className="table-toolbar__search"
          />
          <SegmentedControl
            size="sm"
            ariaLabel="Filter monitors by status"
            value={filter}
            onChange={(value) => setFilter(value)}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'healthy', label: 'Operational', count: counts.healthy },
              { value: 'degraded', label: 'Degraded', count: counts.degraded, tone: 'warning' },
              { value: 'down', label: 'Down', count: counts.down, tone: 'down' },
              { value: 'paused', label: 'Paused', count: counts.paused },
            ]}
          />
          <div className="sort-control">
            <label htmlFor="monitor-sort">Sort</label>
            <select
              id="monitor-sort"
              className="sort-control__select"
              value={sort}
              onChange={(event) => setSort(event.target.value as MonitorSortPreset)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-meta">
          <p>
            Showing <strong>{filtered.length}</strong> of {counts.all} monitors
            {filter !== 'all' && ` · ${filter} filter`}
            {query && ` · matching “${search.trim()}”`}
          </p>
          {filtersActive && (
            <button type="button" className="text-button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        <MonitorTable
          monitors={filtered}
          timeDisplay={settings.timeDisplay}
          showRegion
          sort={sort}
          onSortChange={setSort}
          onSelect={drawer.open}
          onToggleStatus={handleToggle}
          emptyState={
            <EmptyState
              icon={SearchX}
              title={filtersActive ? 'No monitors match these filters' : 'No monitors yet'}
              description={
                filtersActive
                  ? 'Try a different search term, or reset the status filter to see every monitor in this demo workspace.'
                  : 'Add your first monitor to start exploring the demo workspace.'
              }
              action={
                filtersActive ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setAddOpen(true)}
                    iconLeft={<Plus size={15} aria-hidden="true" />}
                  >
                    Add monitor
                  </Button>
                )
              }
            />
          }
        />
      </Card>

      <DemoNote>
        Search, filters, sorting, and pause/resume all operate on the current local dataset. Data
        resets when the page reloads; no monitoring requests are executed.
      </DemoNote>

      <AddMonitorDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={handleAdded} />
      <MonitorDrawer monitorId={drawer.value} onClose={drawer.close} />
    </div>
  );
}
