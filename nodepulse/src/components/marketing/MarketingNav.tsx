import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ButtonLink } from '../ui/Button';

const LINKS = [
  { href: '#platform', label: 'Product' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => firstLinkRef.current?.focus(), 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <header className="marketing-nav">
      <div className="container marketing-nav__inner" ref={menuRef}>
        <Link to="/" className="marketing-nav__brand" aria-label="NodePulse home">
          <Logo />
        </Link>

        <nav className="marketing-nav__links" aria-label="Main navigation">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="marketing-nav__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="marketing-nav__actions">
          <ButtonLink
            to="/app"
            variant="primary"
            size="sm"
            className="marketing-nav__cta"
            iconRight={<ArrowRight size={15} aria-hidden="true" />}
          >
            Explore Live Demo
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            className="icon-btn marketing-nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <div className="mobile-nav-panel" id="mobile-navigation">
            <nav aria-label="Mobile navigation">
              <ul>
                {LINKS.map((link, index) => (
                  <li key={link.href}>
                    <a
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={link.href}
                      className="mobile-nav-panel__link"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <ButtonLink
              to="/app"
              variant="primary"
              size="md"
              className="mobile-nav-panel__cta"
              onClick={() => setOpen(false)}
              iconRight={<ArrowRight size={15} aria-hidden="true" />}
            >
              Explore Live Demo
            </ButtonLink>
            <p className="mobile-nav-panel__note">Interactive demo · Sample data · No account required</p>
          </div>
        )}
      </div>
    </header>
  );
}
