import {
  Activity,
  ChartLine,
  CornerDownLeft,
  LayoutDashboard,
  Search,
  SearchX,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useNativeDialog } from '../../hooks/useDialog';
import { useDemo } from '../../store/DemoDataContext';
import { STATUS_META } from '../../lib/format';
import { Kbd } from '../ui/DemoNote';
import { EmptyState } from '../ui/EmptyState';

interface SearchResult {
  id: string;
  group: 'Pages' | 'Monitors' | 'Incidents';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  path: string;
}

const PAGES: SearchResult[] = [
  { id: 'page-overview', group: 'Pages', title: 'Overview', subtitle: 'Workspace summary', icon: LayoutDashboard, path: '/app' },
  { id: 'page-monitors', group: 'Pages', title: 'Monitors', subtitle: 'All service checks', icon: Activity, path: '/app/monitors' },
  { id: 'page-incidents', group: 'Pages', title: 'Incidents', subtitle: 'Incident history and status', icon: ShieldAlert, path: '/app/incidents' },
  { id: 'page-analytics', group: 'Pages', title: 'Analytics', subtitle: 'Latency and uptime trends', icon: ChartLine, path: '/app/analytics' },
  { id: 'page-settings', group: 'Pages', title: 'Settings', subtitle: 'Workspace preferences', icon: Settings, path: '/app/settings' },
];

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { monitors, incidents } = useDemo();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dialogRef = useNativeDialog(open, onClose);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return PAGES;
    }

    const pages = PAGES.filter(
      (page) =>
        page.title.toLowerCase().includes(needle) ||
        page.subtitle.toLowerCase().includes(needle),
    );
    const monitorResults = monitors
      .filter((monitor) =>
        [monitor.name, monitor.url, monitor.region, monitor.description]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 5)
      .map<SearchResult>((monitor) => ({
        id: `monitor-${monitor.id}`,
        group: 'Monitors',
        title: monitor.name,
        subtitle: `${monitor.url} · ${STATUS_META[monitor.status].label}`,
        icon: Activity,
        path: `/app/monitors?monitor=${encodeURIComponent(monitor.id)}`,
      }));
    const incidentResults = incidents
      .filter((incident) => {
        const affected = incident.affectedMonitorIds
          .map((id) => monitors.find((monitor) => monitor.id === id)?.name ?? '')
          .join(' ');
        return `${incident.title} ${incident.id} ${affected}`
          .toLowerCase()
          .includes(needle);
      })
      .slice(0, 5)
      .map<SearchResult>((incident) => ({
        id: `incident-${incident.id}`,
        group: 'Incidents',
        title: incident.title,
        subtitle: `${incident.id} · ${incident.status}`,
        icon: ShieldAlert,
        path: `/app/incidents?incident=${encodeURIComponent(incident.id)}`,
      }));

    return [...pages, ...monitorResults, ...incidentResults];
  }, [query, monitors, incidents]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const active = results[activeIndex];
    if (!active) return;
    document.getElementById(`search-${active.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, results, open]);

  const openResult = (result: SearchResult | undefined) => {
    if (!result) return;
    navigate(result.path);
    onClose();
  };

  const groups = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    acc[result.group] = [...(acc[result.group] ?? []), result];
    return acc;
  }, {});

  return (
    <dialog
      ref={dialogRef}
      className="palette"
      aria-label="Search workspace"
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveIndex((current) => Math.min(results.length - 1, current + 1));
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActiveIndex((current) => Math.max(0, current - 1));
        } else if (event.key === 'Enter') {
          event.preventDefault();
          openResult(results[activeIndex]);
        }
      }}
    >
      <div className="palette__surface">
        <div className="palette__input-row">
          <Search size={17} aria-hidden="true" className="palette__search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search monitors, endpoints, incidents…"
            aria-label="Search monitors and incidents"
            aria-controls="palette-results"
            aria-activedescendant={
              results[activeIndex] ? `search-${results[activeIndex].id}` : undefined
            }
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            className="palette__input"
            autoComplete="off"
            spellCheck={false}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="palette__results" id="palette-results" role="listbox" aria-label="Search results">
          {results.length === 0 ? (
            <EmptyState
              compact
              icon={SearchX}
              title="No matches"
              description={`Nothing in this demo workspace matches “${query.trim()}”. Try a monitor name, endpoint, region, or incident ID.`}
            />
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="palette__group">
                <p className="palette__group-label" role="presentation">
                  {group}
                </p>
                <ul>
                  {items.map((result) => {
                    const index = results.findIndex((entry) => entry.id === result.id);
                    const Icon = result.icon;
                    return (
                      <li
                        key={result.id}
                        id={`search-${result.id}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        className={index === activeIndex ? 'palette__option is-active' : 'palette__option'}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => openResult(result)}
                      >
                        <span className="palette__option-icon" aria-hidden="true">
                          <Icon size={15} />
                        </span>
                        <span className="palette__option-copy">
                          <span className="palette__option-title">{result.title}</span>
                          <span className="palette__option-subtitle">{result.subtitle}</span>
                        </span>
                        {index === activeIndex && (
                          <CornerDownLeft size={13} aria-hidden="true" className="palette__enter" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="palette__footer">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate
          </span>
          <span>
            <Kbd>↵</Kbd> to open
          </span>
          <span className="palette__footer-note">Searches local demo data only</span>
        </div>
      </div>
    </dialog>
  );
}
