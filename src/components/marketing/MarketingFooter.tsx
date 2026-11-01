import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ButtonLink } from '../ui/Button';

export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container">
        <div className="final-cta__panel">
          <div className="final-cta__grid" aria-hidden="true" />
          <div className="final-cta__content">
            <p className="eyebrow">Ready when you are</p>
            <h2 className="final-cta__title">See the workspace for yourself.</h2>
            <p className="final-cta__copy">
              Open the interactive dashboard with sample monitors, incidents, and analytics — no
              account, no setup, no real monitoring required.
            </p>
            <div className="final-cta__actions">
              <ButtonLink
                to="/app"
                variant="primary"
                size="lg"
                iconRight={<ArrowRight size={17} aria-hidden="true" />}
              >
                Explore Live Demo
              </ButtonLink>
              <span className="final-cta__note">12 sample monitors · 5 regions · 1 demo workspace</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="container">
        <div className="marketing-footer__grid">
          <div className="marketing-footer__brand">
            <Logo />
            <p className="marketing-footer__description">
              An uptime monitoring and service health workspace, built as a frontend portfolio
              demonstration.
            </p>
            <p className="marketing-footer__demo-note">
              NodePulse is a fictional product. All monitors, incidents, customers, and metrics in
              this demo are sample data.
            </p>
          </div>

          <nav className="marketing-footer__col" aria-label="Dashboard links">
            <h3>Workspace</h3>
            <ul>
              <li>
                <Link to="/app">Overview</Link>
              </li>
              <li>
                <Link to="/app/monitors">Monitors</Link>
              </li>
              <li>
                <Link to="/app/incidents">Incidents</Link>
              </li>
              <li>
                <Link to="/app/analytics">Analytics</Link>
              </li>
              <li>
                <Link to="/app/settings">Settings</Link>
              </li>
            </ul>
          </nav>

          <nav className="marketing-footer__col" aria-label="Platform links">
            <h3>Platform</h3>
            <ul>
              <li>
                <a href="#platform">Product</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <a href="#pricing">Demo pricing</a>
              </li>
              <li>
                <a href="#faq">Demo disclosure</a>
              </li>
            </ul>
          </nav>

          <div className="marketing-footer__col">
            <h3>Interactive demo</h3>
            <ul>
              <li>
                <Link to="/app">Open the dashboard</Link>
              </li>
              <li>
                <Link to="/app/settings">Workspace settings</Link>
              </li>
              <li>
                <Link to="/app/settings?tab=data">Demo data details</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="marketing-footer__bottom">
          <p>© 2026 NodePulse · Portfolio demonstration, not a commercial service.</p>
          <p>Built with React, TypeScript, Vite, and handcrafted SVG charts.</p>
        </div>
      </div>
    </footer>
  );
}
