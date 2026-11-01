import { FlaskConical, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function DemoNote({
  children,
  variant = 'info',
  className,
}: {
  children: ReactNode;
  variant?: 'info' | 'demo';
  className?: string;
}) {
  const Icon = variant === 'demo' ? FlaskConical : Info;
  return (
    <div className={cn('callout', `callout--${variant}`, className)}>
      <Icon size={15} aria-hidden="true" className="callout__icon" />
      <p className="callout__text">{children}</p>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}
