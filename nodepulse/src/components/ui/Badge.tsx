import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { STATUS_META } from '../../lib/format';
import type { MonitorStatus } from '../../data/types';

export type Tone =
  | 'healthy'
  | 'warning'
  | 'down'
  | 'info'
  | 'neutral'
  | 'accent'
  | 'purple';

export function Badge({
  tone = 'neutral',
  children,
  className,
  withDot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  withDot?: boolean;
}) {
  return (
    <span className={cn('badge', `badge--${tone}`, className)}>
      {withDot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<MonitorStatus, Tone> = {
  healthy: 'healthy',
  degraded: 'warning',
  down: 'down',
  paused: 'neutral',
};

export function StatusBadge({ status }: { status: MonitorStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn('status-badge', `status-badge--${STATUS_TONE[status]}`)}>
      <span className="status-badge__dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
