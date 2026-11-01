import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  note,
  visual,
  tone = 'default',
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  note: ReactNode;
  visual?: ReactNode;
  tone?: 'default' | 'healthy' | 'warning' | 'down';
}) {
  return (
    <article className={cn('metric-card', `metric-card--${tone}`)}>
      <div className="metric-card__top">
        <h2 className="metric-card__label">{label}</h2>
        <span className="metric-card__icon" aria-hidden="true">
          <Icon size={15} />
        </span>
      </div>
      <div className="metric-card__main">
        <div className="metric-card__value-row">
          <p className="metric-card__value">{value}</p>
          {unit && <span className="metric-card__unit">{unit}</span>}
        </div>
        {visual && <div className="metric-card__visual">{visual}</div>}
      </div>
      <p className="metric-card__note">{note}</p>
    </article>
  );
}
