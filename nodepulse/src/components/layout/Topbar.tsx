import { ChevronRight, Menu, Search } from 'lucide-react';
import { useDemo } from '../../store/DemoDataContext';
import { NotificationMenu } from '../navigation/NotificationMenu';
import { ProfileMenu } from '../navigation/ProfileMenu';
import { Kbd } from '../ui/DemoNote';

export function Topbar({
  pageTitle,
  onOpenNav,
  onOpenSearch,
  onOpenAbout,
}: {
  pageTitle: string;
  onOpenNav: () => void;
  onOpenSearch: () => void;
  onOpenAbout: () => void;
}) {
  const { settings } = useDemo();
  const shortcut = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '⌘K'
    : 'Ctrl K';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="icon-btn topbar__menu"
          onClick={onOpenNav}
          aria-label="Open navigation menu"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb__workspace">{settings.workspaceName}</span>
          <ChevronRight size={13} aria-hidden="true" className="breadcrumb__sep" />
          <span className="breadcrumb__current" aria-current="page">
            {pageTitle}
          </span>
        </nav>
        <p className="topbar__mobile-title">{pageTitle}</p>
      </div>

      <div className="topbar__right">
        <span className="demo-pill" title="Demo environment with fictional sample data">
          <span className="demo-pill__dot" aria-hidden="true" />
          <span className="demo-pill__full">Demo environment</span>
          <span className="demo-pill__short">Demo</span>
        </span>

        <button type="button" className="topbar__search" onClick={onOpenSearch}>
          <Search size={15} aria-hidden="true" />
          <span className="topbar__search-text">Search workspace</span>
          <Kbd>{shortcut}</Kbd>
        </button>

        <button
          type="button"
          className="icon-btn topbar__icon-btn topbar__search-mobile"
          onClick={onOpenSearch}
          aria-label="Search workspace"
        >
          <Search size={17} aria-hidden="true" />
        </button>

        <NotificationMenu />
        <ProfileMenu onOpenAbout={onOpenAbout} />
      </div>
    </header>
  );
}
