import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarContent } from '../components/layout/SidebarContent';
import { Topbar } from '../components/layout/Topbar';
import { MobileNav } from '../components/layout/MobileNav';
import { GlobalSearch } from '../components/navigation/GlobalSearch';
import { AboutDemoModal } from '../components/layout/AboutDemoModal';
import { useDemo } from '../store/DemoDataContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PAGE_TITLES: Record<string, string> = {
  '/app': 'Overview',
  '/app/monitors': 'Monitors',
  '/app/incidents': 'Incidents',
  '/app/analytics': 'Analytics',
  '/app/settings': 'Settings',
};

export function AppLayout() {
  const location = useLocation();
  const { settings } = useDemo();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Workspace';

  useDocumentTitle(`${pageTitle} · NodePulse demo`);

  useEffect(() => {
    setNavOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell" data-density={settings.density}>
      <a href="#main-content" className="skip-link">
        Skip to workspace content
      </a>

      <aside className="sidebar" aria-label="Workspace sidebar">
        <SidebarContent />
      </aside>

      <div className="app-frame">
        <Topbar
          pageTitle={pageTitle}
          onOpenNav={() => setNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
        />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <div className="app-content">
            <Outlet />
          </div>
          <footer className="app-footer">
            <span>NodePulse portfolio demo · Fictional sample data, no live monitoring.</span>
            <button type="button" className="app-footer__link" onClick={() => setAboutOpen(true)}>
              About this demo
            </button>
          </footer>
        </main>
      </div>

      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AboutDemoModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
