import { cn } from '../../lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** Optional semantic tone applied when the option is active. */
  tone?: 'warning' | 'down';
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('segmented', `segmented--${size}`, className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn('segmented__btn', active && 'is-active')}
            data-tone={option.tone}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className="segmented__count" aria-hidden="true">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
