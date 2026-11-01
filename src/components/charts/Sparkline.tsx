import { useId } from 'react';

const TONE_VAR = {
  cyan: 'var(--accent-cyan)',
  healthy: 'var(--status-healthy)',
  warning: 'var(--status-warning)',
  down: 'var(--status-down)',
  purple: 'var(--accent-purple)',
  muted: 'var(--text-muted)',
} as const;

export type SparkTone = keyof typeof TONE_VAR;

export function Sparkline({
  values,
  tone = 'cyan',
  height = 34,
  width = 96,
  filled = true,
  fluid = false,
}: {
  values: number[];
  tone?: SparkTone;
  height?: number;
  width?: number;
  filled?: boolean;
  /** Stretch to the container width (used for preview illustrations). */
  fluid?: boolean;
}) {
  const gradientId = useId().replace(/:/g, '');
  const usable = values.filter((value) => Number.isFinite(value));
  if (usable.length < 2) {
    return <div className="sparkline sparkline--empty" style={{ width, height }} aria-hidden="true" />;
  }

  const min = Math.min(...usable);
  const max = Math.max(...usable);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 3 - ((value - min) / span) * (height - 6);
    return { x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join('');
  const area = `${line}L${width},${height}L0,${height}Z`;

  return (
    <svg
      className="sparkline"
      width={fluid ? '100%' : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fluid ? 'none' : undefined}
      aria-hidden="true"
      style={{ color: TONE_VAR[tone] }}
    >
      {filled && (
        <>
          <defs>
            <linearGradient id={`spark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#spark-${gradientId})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect={fluid ? 'non-scaling-stroke' : undefined}
      />
    </svg>
  );
}

/** Compact dot grid showing the status of every monitor in the workspace. */
export function StatusDotGrid({
  statuses,
  max = 24,
}: {
  statuses: ('healthy' | 'degraded' | 'down' | 'paused')[];
  max?: number;
}) {
  const tone = {
    healthy: 'var(--status-healthy)',
    degraded: 'var(--status-warning)',
    down: 'var(--status-down)',
    paused: 'var(--text-muted)',
  };
  const shown = statuses.slice(0, max);
  return (
    <div className="dot-grid" aria-hidden="true">
      {shown.map((status, index) => (
        <span
          key={`${status}-${index}`}
          className="dot-grid__dot"
          style={{ background: tone[status] }}
        />
      ))}
      {statuses.length > max && <span className="dot-grid__more">+{statuses.length - max}</span>}
    </div>
  );
}
