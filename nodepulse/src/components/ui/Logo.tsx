import { cn } from '../../lib/cn';

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={cn('logo-mark', className)}
      role="img"
      aria-label="NodePulse"
    >
      <rect
        x="0.75"
        y="0.75"
        width="26.5"
        height="26.5"
        rx="7.25"
        fill="var(--bg-elevated)"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
      />
      <path
        d="M4.8 15.2h4.1l2.2-5.8 3.3 10.4 2.4-7 1.5 2.4h4.9"
        fill="none"
        stroke="var(--accent-cyan)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21.4" cy="7.4" r="1.9" fill="var(--status-healthy)" />
    </svg>
  );
}

export function Logo({
  size = 28,
  className,
  showWordmark = true,
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('logo', className)}>
      <LogoMark size={size} />
      {showWordmark && <span className="logo__wordmark">NodePulse</span>}
    </span>
  );
}
