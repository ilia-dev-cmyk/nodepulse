import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  RotateCcw,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { SearchInput } from '../components/ui/SearchInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState } from '../components/ui/EmptyState';
import { DemoNote } from '../components/ui/DemoNote';
import { useDemo } from '../store/DemoDataContext';
import { useToast } from '../store/ToastContext';
import { useDrawerParam } from '../hooks/useDrawerParam';
import { getIncidentStatusCounts } from '../lib/selectors';
import {
  INCIDENT_STATUS_META,
  SEVERITY_META,
  formatDuration,
  formatDurationMs,
  formatTimestamp,
} from '../lib/format';
import type { Incident, IncidentStatus } from '../data/types';

type FilterValue = 'all' | IncidentStatus;

const SEVERITY_ORDER = { critical: 0, major: 1, minor: 2 } as const;

export function IncidentsPage() {
  const { incidents, monitors, settings, resolveIncident, reopenIncident } = useDemo();
  const { showToast } = useToast();
  const drawer = useDrawerParam('incident');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState<{ incident: Incident; action: 'resolve' | 'reopen' } | null>(null);

  const counts = getIncidentStatusCounts(incidents);
  const query = search.trim().toLowerCase();

  const visible = useMemo(() => {
    return incidents
      .filter((incident) => {
        if (filter !== 'all' && incident.status !== filter) return false;
        if (!query) return true;
        const services = incident.affectedMonitorIds
          .map((id) => monitors.find((monitor) => monitor.id === id)?.name ?? '')
          .join(' ');
        return `${incident.title} ${incident.id} ${services}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aResolved = a.status === 'resolved' ? 1 : 0;
        const bResolved = b.status === 'resolved' ? 1 : 0;
        if (aResolved !== bResolved) return aResolved - bResolved;
        const severityDelta = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (severityDelta !== 0) return severityDelta;
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      });
  }, [incidents, monitors, filter, query]);

  const filtersActive = filter !== 'all' || query.length > 0;
  const selected = drawer.value ? incidents.find((incident) => incident.id === drawer.value) : null;
  const selectedStatus = selected ? INCIDENT_STATUS_META[selected.status] : null;
  const resolvedDurations = incidents
    .filter((incident) => incident.status === 'resolved' && incident.resolvedAt)
    .map(
      (incident) =>
        new Date(incident.resolvedAt as string).getTime() - new Date(incident.startedAt).getTime(),
    );
  const averageResolution = resolvedDurations.length
    ? Math.round(resolvedDurations.reduce((total, value) => total + value, 0) / resolvedDurations.length)
    : null;

  const affectedNames = (incident: Incident) =>
    incident.affectedMonitorIds
      .map((id) => monitors.find((monitor) => monitor.id === id)?.name)
      .filter((name): name is string => Boolean(name));

  const confirmAction = () => {
    if (!pendingAction) return;
    const { incident, action } = pendingAction;
    if (action === 'resolve') {
      resolveIncident(incident.id);
      showToast(`${incident.id} marked resolved in the local demo workspace.`, 'success');
    } else {
      reopenIncident(incident.id);
      showToast(`${incident.id} reopened in the local demo workspace.`, 'info');
    }
    setPendingAction(null);
  };

  return (
    <div className="page">
      <PageHeader
        title="Incidents"
        description="Review service disruptions, follow investigation updates, and manage incident state in the demo workspace."
        meta={
          <Badge tone={counts.investigating + counts.monitoring > 0 ? 'warning' : 'healthy'} withDot>
            {counts.investigating + counts.monitoring} active
          </Badge>
        }
        actions={
          <div className="incident-summary">
            <span>
              <strong>{counts.resolved}</strong> resolved
            </span>
            <span className="incident-summary__divider" aria-hidden="true" />
            <span>
              Avg resolution{' '}
              <strong>
                {averageResolution === null ? '—' : formatDurationMs(averageResolution)}
              </strong>
            </span>
          </div>
        }
      />

      <Card padded={false} className="incidents-panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            label="Search incidents"
            placeholder="Search incidents or affected services…"
            className="table-toolbar__search"
          />
          <SegmentedControl
            size="sm"
            ariaLabel="Filter incidents by status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'investigating', label: 'Investigating', count: counts.investigating },
              { value: 'monitoring', label: 'Monitoring', count: counts.monitoring },
              { value: 'resolved', label: 'Resolved', count: counts.resolved },
            ]}
          />
        </div>
        <div className="table-meta">
          <p>
            Showing <strong>{visible.length}</strong> of {counts.all} incidents
            {filter !== 'all' && ` · ${filter}`}
            {query && ` · matching “${search.trim()}”`}
          </p>
          {filtersActive && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setFilter('all');
                setSearch('');
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {visible.length ? (
          <ul className="incident-list">
            {visible.map((incident) => {
              const statusMeta = INCIDENT_STATUS_META[incident.status];
              const names = affectedNames(incident);
              return (
                <li key={incident.id}>
                  <Link
                    className={`incident-card incident-card--${incident.severity}`}
                    to={`/app/incidents?incident=${encodeURIComponent(incident.id)}`}
                  >
                    <span className="incident-card__rail" aria-hidden="true" />
                    <div className="incident-card__content">
                      <div className="incident-card__head">
                        <Badge tone={SEVERITY_META[incident.severity].tone} withDot>
                          {SEVERITY_META[incident.severity].label}
                        </Badge>
                        <span className="incident-card__id mono">{incident.id}</span>
                        <span className={`incident-state incident-state--${statusMeta.tone}`}>
                          <span className="incident-state__dot" aria-hidden="true" />
                          {statusMeta.label}
                        </span>
                        <span className="incident-card__started">
                          Started {formatTimestamp(incident.startedAt, settings.timeDisplay)}
                        </span>
                      </div>
                      <h2 className="incident-card__title">{incident.title}</h2>
                      <p className="incident-card__description">{incident.description}</p>
                      <div className="incident-card__meta">
                        <span className="incident-card__meta-item">
                          <Activity size={13} aria-hidden="true" />
                          {names.length ? names.join(', ') : 'No monitors linked'}
                        </span>
                        <span className="incident-card__meta-item">
                          <Clock size={13} aria-hidden="true" />
                          {formatDuration(incident.startedAt, incident.resolvedAt)}
                          {incident.status !== 'resolved' ? ' open' : ''}
                        </span>
                        <span className="incident-card__meta-item">
                          <MessageSquare size={13} aria-hidden="true" />
                          {incident.timeline.length} updates
                        </span>
                      </div>
                      <div className="incident-card__foot">
                        <span className="incident-card__latest">
                          Latest: {incident.timeline[incident.timeline.length - 1]?.title ?? '—'}
                        </span>
                        <span className="incident-card__open">
                          View timeline
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={filtersActive ? SearchX : ShieldCheck}
            title={filtersActive ? 'No incidents match these filters' : 'No incidents recorded'}
            description={
              filtersActive
                ? 'Try another search term or reset the status filter to see the full iteration history of this demo workspace.'
                : 'There are no incidents in this demo workspace yet.'
            }
            action={
              filtersActive ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </Card>

      <DemoNote>
        Incident updates are local demo changes. No alerts are sent, no on-call engineer is paged,
        and resolving an incident here does not alter any real service.
      </DemoNote>

      {selected && (
        <Drawer
          open
          onClose={drawer.close}
          eyebrow={`Incident · ${selected.id}`}
          title={selected.title}
          subtitle={
            <span className="drawer__status-line">
              <Badge tone={SEVERITY_META[selected.severity].tone} withDot>
                {SEVERITY_META[selected.severity].label}
              </Badge>
              {selectedStatus && (
                <span className={`incident-state incident-state--${selectedStatus.tone}`}>
                  <span className="incident-state__dot" aria-hidden="true" />
                  {selectedStatus.label}
                </span>
              )}
              <span className="text-muted">Started {formatTimestamp(selected.startedAt, settings.timeDisplay)}</span>
            </span>
          }
          footer={
            <div className="drawer__footer-actions">
              <Button variant="ghost" onClick={drawer.close}>
                Close
              </Button>
              {selected.status === 'resolved' ? (
                <Button
                  variant="secondary"
                  iconLeft={<RotateCcw size={15} aria-hidden="true" />}
                  onClick={() => setPendingAction({ incident: selected, action: 'reopen' })}
                >
                  Reopen incident
                </Button>
              ) : (
                <Button
                  variant="primary"
                  iconLeft={<CheckCircle2 size={15} aria-hidden="true" />}
                  onClick={() => setPendingAction({ incident: selected, action: 'resolve' })}
                >
                  Resolve incident
                </Button>
              )}
            </div>
          }
        >
          <div className="drawer-section">
            <p className="drawer-description">{selected.description}</p>
            <div className="incident-facts">
              <div className="stat-tile">
                <p className="meta-label">Started</p>
                <p className="stat-tile__value stat-tile__value--small">
                  {formatTimestamp(selected.startedAt, settings.timeDisplay)}
                </p>
              </div>
              <div className="stat-tile">
                <p className="meta-label">{selected.status === 'resolved' ? 'Resolved' : 'Duration'}</p>
                <p className="stat-tile__value stat-tile__value--small">
                  {selected.status === 'resolved'
                    ? formatTimestamp(selected.resolvedAt, settings.timeDisplay)
                    : formatDuration(selected.startedAt)}
                </p>
              </div>
            </div>
            <div className="incident-note">
              <p className="meta-label">Impact</p>
              <p>{selected.impact}</p>
            </div>
            <div className="incident-note">
              <p className="meta-label">Root cause</p>
              <p>{selected.rootCause}</p>
            </div>
          </div>

          <section className="drawer-section" aria-labelledby="affected-title">
            <div className="drawer-section__head">
              <h3 className="drawer-section__title" id="affected-title">
                Affected monitors
              </h3>
              <span className="meta-label">{selected.affectedMonitorIds.length} linked</span>
            </div>
            <ul className="affected-list">
              {selected.affectedMonitorIds.map((id) => {
                const monitor = monitors.find((entry) => entry.id === id);
                if (!monitor) {
                  return (
                    <li key={id} className="affected-item affected-item--missing">
                      <span className="mono">{id}</span>
                      <span>Monitor not in this demo dataset</span>
                    </li>
                  );
                }
                return (
                  <li key={id}>
                    <Link
                      to={`/app/monitors?monitor=${encodeURIComponent(monitor.id)}`}
                      className="affected-item"
                      onClick={drawer.close}
                    >
                      <span className="affected-item__name">{monitor.name}</span>
                      <StatusBadge status={monitor.status} />
                      <ArrowUpRight size={13} aria-hidden="true" className="affected-item__arrow" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="drawer-section" aria-labelledby="timeline-title">
            <div className="drawer-section__head">
              <h3 className="drawer-section__title" id="timeline-title">
                Timeline
              </h3>
              <span className="meta-label">{selected.timeline.length} updates</span>
            </div>
            <ol className="timeline">
              {selected.timeline.map((entry) => (
                <li key={entry.id} className="timeline__item">
                  <span className="timeline__dot" aria-hidden="true" />
                  <div className="timeline__content">
                    <p className="timeline__title">
                      {entry.title}
                      {entry.addedInDemo && <Badge tone="accent">Demo update</Badge>}
                    </p>
                    {entry.detail && <p className="timeline__detail">{entry.detail}</p>}
                    <p className="timeline__meta">
                      {entry.author} · {formatTimestamp(entry.at, settings.timeDisplay)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <DemoNote>
            This incident is fictional sample data. Resolving or reopening it only changes the
            local demo dataset and the overview counters.
          </DemoNote>
        </Drawer>
      )}

      <Modal
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={
          pendingAction?.action === 'resolve'
            ? `Resolve ${pendingAction.incident.id}?`
            : `Reopen ${pendingAction?.incident.id ?? 'incident'}?`
        }
        description={
          pendingAction?.action === 'resolve'
            ? 'The incident will be marked resolved and active incident counters will update.'
            : 'The incident returns to investigating so you can continue the demo workflow.'
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmAction}>
              {pendingAction?.action === 'resolve' ? 'Resolve incident' : 'Reopen incident'}
            </Button>
          </>
        }
      >
        <DemoNote variant="demo">
          This is a local demo change. No status page is updated, no customer notification is sent,
          and no engineer is paged.
        </DemoNote>
      </Modal>
    </div>
  );
}
