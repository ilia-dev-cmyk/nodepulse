import { ArrowLeft, ArrowRight, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ButtonLink } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found · NodePulse');

  return (
    <div className="not-found">
      <div className="not-found__backdrop" aria-hidden="true">
        <span className="hero__grid" />
      </div>
      <header className="not-found__header container">
        <Link to="/" aria-label="NodePulse home">
          <Logo />
        </Link>
      </header>
      <main className="not-found__main container" id="main-content">
        <div className="not-found__panel">
          <span className="not-found__code mono">404 · NO SIGNAL</span>
          <span className="not-found__icon" aria-hidden="true">
            <Radar size={26} />
          </span>
          <h1 className="not-found__title">This route has no monitor attached.</h1>
          <p className="not-found__copy">
            The page you requested does not exist in this demo. Check the URL, or head back to the
            marketing site and open the workspace from there.
          </p>
          <div className="not-found__actions">
            <ButtonLink
              to="/"
              variant="primary"
              iconLeft={<ArrowLeft size={15} aria-hidden="true" />}
            >
              Back to marketing site
            </ButtonLink>
            <ButtonLink
              to="/app"
              variant="secondary"
              iconRight={<ArrowRight size={15} aria-hidden="true" />}
            >
              Open the demo dashboard
            </ButtonLink>
          </div>
          <p className="not-found__note">
            NodePulse is a fictional portfolio demo. All monitoring data is sample data.
          </p>
        </div>
      </main>
    </div>
  );
}
