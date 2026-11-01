import { useId, useMemo, useState } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth';
import { cn } from '../../lib/cn';

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
  points: (number | null)[];
  dashed?: boolean;
}

export interface LineChartProps {
  labels: string[];
  longLabels?: string[];
  series: ChartSeries[];
  ariaLabel: string;
  height?: number;
  unit?: 'ms' | '%';
  valueFormatter?: (value: number) => string;
  showArea?: boolean;
  yDomain?: [number, number];
  emptyMessage?: string;
  className?: string;
}

const PADDING = { top: 16, right: 14, bottom: 30, left: 52 };

/**
 * The chart draws in viewBox units and is then scaled by CSS (`width: 100%`).
 * `usableWidth` is that internal coordinate system, while `renderedWidth` is
 * the CSS pixel width on screen. Pointer coordinates arrive in CSS pixels, so
 * every conversion between the two goes through `viewBoxToCss` / `cssToViewBox`.
 */
const MIN_CHART_WIDTH = 240;
/** Used only for the first paint, before the ResizeObserver reports a width. */
const INITIAL_CHART_WIDTH = 320;
/** Half of the widest possible tooltip (max-width 220px), used to keep it on screen. */
const TOOLTIP_HALF_WIDTH = 110;

function defaultFormatter(unit: 'ms' | '%') {
  return (value: number) =>
    unit === '%' ? `${value.toFixed(2)}%` : `${Math.round(value)} ms`;
}

function computeDomain(
  allValues: number[],
  unit: 'ms' | '%',
  explicit?: [number, number],
): [number, number] {
  if (explicit) return explicit;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  if (unit === '%') {
    const lo = Math.floor((min - 0.04) * 10) / 10;
    const hi = Math.min(100, Math.ceil((max + 0.02) * 10) / 10);
    return [Math.max(0, Math.min(lo, hi - 0.2)), hi];
  }

  const hi = Math.max(100, Math.ceil((max * 1.16) / 50) * 50);
  return [0, hi];
}

function tickIndices(count: number, maxTicks: number): number[] {
  if (count === 0) return [];
  if (count <= maxTicks) return Array.from({ length: count }, (_, index) => index);
  const step = (count - 1) / (maxTicks - 1);
  const indices = new Set<number>();
  for (let i = 0; i < maxTicks; i += 1) indices.add(Math.round(i * step));
  return [...indices].sort((a, b) => a - b);
}

export function LineChart({
  labels,
  longLabels,
  series,
  ariaLabel,
  height = 260,
  unit = 'ms',
  valueFormatter,
  showArea = false,
  yDomain,
  emptyMessage = 'No data available for this range.',
  className,
}: LineChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, '');
  const format = valueFormatter ?? defaultFormatter(unit);

  const usableWidth =
    width > 0 ? Math.max(width, MIN_CHART_WIDTH) : INITIAL_CHART_WIDTH;
  const renderedWidth = width > 0 ? width : usableWidth;
  const viewBoxToCss = usableWidth > 0 ? renderedWidth / usableWidth : 1;
  const innerWidth = usableWidth - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const allValues = useMemo(
    () => series.flatMap((entry) => entry.points).filter((v): v is number => v !== null),
    [series],
  );

  const domain = useMemo(
    () => (allValues.length ? computeDomain(allValues, unit, yDomain) : ([0, 1] as [number, number])),
    [allValues, unit, yDomain],
  );

  const pointCount = Math.max(labels.length, ...series.map((entry) => entry.points.length), 0);
  const xFor = (index: number) =>
    pointCount > 1 ? PADDING.left + (index / (pointCount - 1)) * innerWidth : PADDING.left + innerWidth / 2;
  const yFor = (value: number) => {
    const [lo, hi] = domain;
    const ratio = hi === lo ? 0.5 : (value - lo) / (hi - lo);
    return PADDING.top + (1 - Math.min(1, Math.max(0, ratio))) * innerHeight;
  };

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i += 1) {
      ticks.push(domain[0] + ((domain[1] - domain[0]) * i) / steps);
    }
    return ticks;
  }, [domain]);

  const maxXTicks = usableWidth < 460 ? 3 : usableWidth < 760 ? 5 : 6;
  const xTicks = tickIndices(pointCount, maxXTicks);

  const paths = useMemo(
    () =>
      series.map((entry) => {
        const segments: string[][] = [];
        let current: string[] = [];
        entry.points.forEach((value, index) => {
          if (value === null) {
            if (current.length > 1) segments.push(current);
            current = [];
            return;
          }
          current.push(`${xFor(index).toFixed(2)},${yFor(value).toFixed(2)}`);
        });
        if (current.length > 1) segments.push(current);
        const line = segments.map((segment) => `M${segment.join('L')}`).join('');

        let area = '';
        if (showArea) {
          const baseline = height - PADDING.bottom;
          let run: { x: number; y: number }[] = [];
          const flush = () => {
            if (!run.length) return;
            area += `M${run[0].x.toFixed(2)},${baseline}L${run
              .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
              .join('L')}L${run[run.length - 1].x.toFixed(2)},${baseline}Z`;
            run = [];
          };
          entry.points.forEach((value, index) => {
            if (value === null) {
              flush();
              return;
            }
            run.push({ x: xFor(index), y: yFor(value) });
          });
          flush();
        }

        return { ...entry, line, area };
      }),
    [series, innerWidth, innerHeight, domain, showArea, height, pointCount],
  );

  const handlePointer = (clientX: number, target: SVGSVGElement) => {
    if (pointCount === 0) return;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return;

    // Convert the pointer from rendered CSS pixels into viewBox units so the
    // hit test stays accurate when the SVG is scaled responsively.
    const cssToViewBox = usableWidth / rect.width;
    const viewBoxX = (clientX - rect.left) * cssToViewBox;
    const step = pointCount > 1 ? innerWidth / (pointCount - 1) : innerWidth;
    const index = Math.round((viewBoxX - PADDING.left) / step);
    setActiveIndex(Math.min(pointCount - 1, Math.max(0, index)));
  };

  const activeValues = activeIndex === null
    ? []
    : series.map((entry) => ({ ...entry, value: entry.points[activeIndex] ?? null }));
  const activeLabel =
    activeIndex === null ? '' : (longLabels?.[activeIndex] ?? labels[activeIndex] ?? '');

  const liveSummary =
    activeIndex === null
      ? ''
      : `${activeLabel}: ${activeValues
          .map((entry) => `${entry.label} ${entry.value === null ? 'no data' : format(entry.value)}`)
          .join(', ')}`;

  if (!allValues.length) {
    return (
      <div className={cn('chart-empty', className)} style={{ height }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // The tooltip is a CSS-positioned element, so its offset must be expressed in
  // rendered pixels rather than viewBox units, and clamped so it stays visible.
  const tooltipLeft =
    activeIndex === null
      ? 0
      : Math.min(
          Math.max(xFor(activeIndex) * viewBoxToCss, TOOLTIP_HALF_WIDTH),
          Math.max(TOOLTIP_HALF_WIDTH, renderedWidth - TOOLTIP_HALF_WIDTH),
        );

  return (
    <div className={cn('chart', className)} ref={containerRef}>
      <svg
        width={usableWidth}
        height={height}
        viewBox={`0 0 ${usableWidth} ${height}`}
        role="group"
        aria-label={`${ariaLabel} Use the left and right arrow keys to read individual data points.`}
        tabIndex={0}
        className="chart__svg"
        onPointerMove={(event) => handlePointer(event.clientX, event.currentTarget)}
        onPointerLeave={() => setActiveIndex(null)}
        onPointerDown={(event) => handlePointer(event.clientX, event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            setActiveIndex((current) => {
              const base = current ?? (event.key === 'ArrowRight' ? -1 : pointCount);
              return Math.min(pointCount - 1, Math.max(0, base + (event.key === 'ArrowRight' ? 1 : -1)));
            });
          } else if (event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
          } else if (event.key === 'End') {
            event.preventDefault();
            setActiveIndex(pointCount - 1);
          } else if (event.key === 'Escape') {
            setActiveIndex(null);
          }
        }}
        onBlur={() => setActiveIndex(null)}
      >
        {showArea && (
          <defs>
            <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-fill-from)" />
              <stop offset="100%" stopColor="var(--chart-fill-to)" />
            </linearGradient>
          </defs>
        )}

        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={PADDING.left}
              x2={usableWidth - PADDING.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
            <text
              x={PADDING.left - 10}
              y={yFor(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="chart__axis-label"
            >
              {unit === '%' ? `${tick.toFixed(1)}%` : Math.round(tick)}
            </text>
          </g>
        ))}

        {xTicks.map((index) => (
          <text
            key={`x-${index}`}
            x={xFor(index)}
            y={height - 8}
            textAnchor={index === 0 ? 'start' : index === pointCount - 1 ? 'end' : 'middle'}
            className="chart__axis-label"
          >
            {labels[index]}
          </text>
        ))}

        {activeIndex !== null && (
          <line
            x1={xFor(activeIndex)}
            x2={xFor(activeIndex)}
            y1={PADDING.top}
            y2={height - PADDING.bottom}
            stroke="var(--chart-crosshair)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {paths.map((entry) => (
          <g key={entry.id}>
            {showArea && entry.area && (
              <path d={entry.area} fill={`url(#area-${gradientId})`} />
            )}
            {entry.line && (
              <path
                d={entry.line}
                fill="none"
                stroke={entry.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={entry.dashed ? '4 4' : undefined}
              />
            )}
            {activeIndex !== null && entry.points[activeIndex] !== null && (
              <circle
                cx={xFor(activeIndex)}
                cy={yFor(entry.points[activeIndex] as number)}
                r={4}
                fill="var(--bg-elevated)"
                stroke={entry.color}
                strokeWidth={2.5}
              />
            )}
          </g>
        ))}
      </svg>

      {activeIndex !== null && activeValues.length > 0 && (
        <div
          className="chart-tooltip"
          style={{ left: `${tooltipLeft}px` }}
          role="presentation"
        >
          <p className="chart-tooltip__label">{activeLabel}</p>
          {activeValues.map((entry) => (
            <p className="chart-tooltip__row" key={entry.id}>
              <span className="chart-tooltip__swatch" style={{ background: entry.color }} />
              <span className="chart-tooltip__name">{entry.label}</span>
              <span className="chart-tooltip__value">
                {entry.value === null ? 'No data' : format(entry.value)}
              </span>
            </p>
          ))}
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {liveSummary}
      </div>
    </div>
  );
}
