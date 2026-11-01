import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  label: string;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export function IconButton({ label, children, size = 'md', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn('icon-btn', size === 'sm' && 'icon-btn--sm', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}
