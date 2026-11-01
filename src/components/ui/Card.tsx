import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, className, padded = true, ...rest }: CardProps) {
  return (
    <div className={cn('card', padded && 'card--padded', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  as: Tag = 'h2',
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className="card-header">
      <div className="card-header__titles">
        <Tag className="card-header__title">{title}</Tag>
        {description && <p className="card-header__description">{description}</p>}
      </div>
      {actions && <div className="card-header__actions">{actions}</div>}
    </div>
  );
}
