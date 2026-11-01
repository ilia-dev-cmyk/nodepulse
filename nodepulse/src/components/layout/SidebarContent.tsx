import {
  Activity,
  ChartLine,
  ChevronDown,
  LayoutDashboard,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Popover } from '../ui/Popover';
import { useDemo } from '../../store/DemoDataContext';
import { getActiveIncidents } from '../../lib/selectors';
import { cn } from '../../lib/cn';

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/monitors', label: 'Monitors', icon: Activity, end: false },
  { to: '/app/incidents', label: 'Incidents', icon: ShieldAlert, end: false },
  { to: '/app/analytics', label: 'Analytics', icon: ChartLine, end: false },
  { to: '/app/settings', label: 'Settings', icon: Settings, end: false },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { settings, monitors, incidents } = useDemo();
  const activeIncidents = getActiveIncidents(incidents);
  const initials = settings.workspaceName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="sidebar__inner">
      <div className="sidebar__brand">
        <Link to="/app" className="sidebar__brand-link" onClick={onNavigate} aria-label="NodePulse overview">
          <Logo />
        </Link>
      </div>

      <Popover
        label="Workspace menu"
        className="workspace"
        panelClassName="workspace__panel"
        trigger={({ onClick, ref, ...aria }) => (
          <button
            type="button"
            className="workspace__trigger"
            onClick={onClick}
            ref={ref}
            {...aria}
          >
            <span className="workspace__avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="workspace__identity">
              <span className="workspace__name">{settings.workspaceName}</span>
              <span className="workspace__plan">Portfolio demo workspace</span>
            </span>
            <ChevronDown size={14} className="workspace__chevron" aria-hidden="true" />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="menu__header-block">
              <p className="menu__title">Workspace</p>
              <p className="menu__hint">
                {settings.workspaceName} · {monitors.length} monitors · sample data
              </p>
            </div>
            <div className="menu__list">
              <Link to="/app/settings" className="menu__item" onClick={close}>
                <Settings size={15} aria-hidden="true" />
                Workspace settings
              </Link>
              <Link to="/" className="menu__item" onClick={close}>
                <LayoutDashboard size={15} aria-hidden="true" />
                Back to marketing site
              </Link>
            </div>
            <p className="menu__footer-note">
              Switching workspaces is not part of this single-workspace demo.
            </p>
          </>
        )}
      </Popover>

      <nav className="sidebar__nav" aria-label="Workspace navigation">
        <p className="sidebar__section-label">Workspace</p>
        <ul>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) => cn('sidebar__link', isActive && 'is-active')}
                >
                  <Icon size={17} aria-hidden="true" className="sidebar__icon" />
                  <span>{item.label}</span>
                  {item.to === '/app/incidents' && activeIncidents.length > 0 && (
                    <span className="sidebar__count" aria-label={`${activeIncidents.length} active incidents`}>
                      {activeIncidents.length}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <div className="demo-card">
          <p className="demo-card__label">
            <span className="demo-card__dot" aria-hidden="true" />
            Demo environment
          </p>
          <p className="demo-card__text">
            Fictional sample data. No real network checks run and changes stay in this browser session.
          </p>
          <Link to="/" className="demo-card__link" onClick={onNavigate}>
            About NodePulse
          </Link>
        </div>
        <p className="sidebar__version">NodePulse demo · v1.0</p>
      </div>
    </div>
  );
}
