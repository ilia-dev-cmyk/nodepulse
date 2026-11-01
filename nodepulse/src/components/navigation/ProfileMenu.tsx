import { ChevronDown, FlaskConical, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Popover } from '../ui/Popover';
import { DEMO_USER } from '../../data/demoData';

export function ProfileMenu({ onOpenAbout }: { onOpenAbout: () => void }) {
  return (
    <Popover
      label="Account menu"
      panelClassName="profile-panel"
      trigger={({ onClick, ref, ...aria }) => (
        <button
          type="button"
          className="profile-trigger"
          onClick={onClick}
          ref={ref}
          aria-label={`Account menu for ${DEMO_USER.name}`}
          {...aria}
        >
          <span className="avatar avatar--sm" aria-hidden="true">
            {DEMO_USER.initials}
          </span>
          <ChevronDown size={14} className="profile-trigger__chevron" aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="profile-panel__identity">
            <span className="avatar" aria-hidden="true">
              {DEMO_USER.initials}
            </span>
            <div>
              <p className="profile-panel__name">{DEMO_USER.name}</p>
              <p className="profile-panel__email">{DEMO_USER.email}</p>
              <p className="profile-panel__badge">Demo account</p>
            </div>
          </div>
          <div className="menu__list">
            <Link to="/app/settings" className="menu__item" onClick={close}>
              <Settings size={15} aria-hidden="true" />
              Workspace settings
            </Link>
            <button
              type="button"
              className="menu__item"
              onClick={() => {
                close();
                onOpenAbout();
              }}
            >
              <FlaskConical size={15} aria-hidden="true" />
              About this demo
            </button>
          </div>
          <p className="menu__footer-note">
            This is a fictional account used for the portfolio demonstration.
          </p>
        </>
      )}
    </Popover>
  );
}
