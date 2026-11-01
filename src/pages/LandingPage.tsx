import { useEffect } from 'react';
import { ArrowRight, ChartLine, Command, FlaskConical, ShieldAlert } from 'lucide-react';
import { MarketingNav } from '../components/marketing/MarketingNav';
import { HeroPreview } from '../components/marketing/HeroPreview';
import { ProductPreview } from '../components/marketing/ProductPreview';
import { FeatureSection } from '../components/marketing/FeatureSection';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { PricingSection } from '../components/marketing/PricingSection';
import { FaqSection } from '../components/marketing/FaqSection';
import { FinalCta, MarketingFooter } from '../components/marketing/MarketingFooter';
import { ButtonLink } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function LandingPage() {
  useDocumentTitle('NodePulse — Uptime intelligence for modern teams');

  // Deep links such as /#pricing are resolved after React has mounted the sections.
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="marketing">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <MarketingNav />

      <main id="main-content" tabIndex={-1}>

        <section className="hero">
          <div className="hero__backdrop" aria-hidden="true">
            <span className="hero__grid" />
            <span className="hero__glow" />
          </div>
          <div className="container hero__inner">
            <div className="hero__copy">
              <p className="eyebrow hero__eyebrow">
                <span className="hero__pulse" aria-hidden="true" />
                Uptime intelligence for modern teams
              </p>
              <h1 className="hero__title">Know before your users do.</h1>
              <p className="hero__lede">
                Monitor service health, spot latency spikes, and understand incidents from one
                focused workspace.
              </p>
              <div className="hero__ctas">
                <ButtonLink
                  to="/app"
                  variant="primary"
                  size="lg"
                  iconRight={<ArrowRight size={17} aria-hidden="true" />}
                >
                  Explore Live Demo
                </ButtonLink>
                <a href="#platform" className="btn btn--secondary btn--lg hero__secondary-cta">
                  Discover the Platform
                </a>
              </div>
              <p className="hero__note">
                <FlaskConical size={14} aria-hidden="true" />
                Interactive demo · Sample data · No account required
              </p>
              <ul className="hero-capabilities">
                <li>
                  <ChartLine size={14} aria-hidden="true" />
                  Uptime and latency charts
                </li>
                <li>
                  <ShieldAlert size={14} aria-hidden="true" />
                  Incident timelines
                </li>
                <li>
                  <Command size={14} aria-hidden="true" />
                  Keyboard search with ⌘K
                </li>
              </ul>
            </div>
            <div className="hero__visual">
              <HeroPreview />
            </div>
          </div>
        </section>

        <section className="section section--preview" id="platform">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <p className="eyebrow">The product</p>
                <h2 className="section-heading__title">A focused workspace, not a wall of charts.</h2>
              </div>
              <p className="section-heading__copy">
                The dashboard keeps fleet health, trends, and the monitor list in one deliberate
                hierarchy. Everything below is rendered by the same components as the live demo.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <FeatureSection />
        <HowItWorks />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>

      <MarketingFooter />
    </div>
  );
}
