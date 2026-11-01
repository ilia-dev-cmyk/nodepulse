export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 168,
  thickness = 16,
  centerValue,
  centerLabel,
  ariaLabel,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerValue: string;
  centerLabel: string;
  ariaLabel: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${ariaLabel}. ${slices
          .map((slice) => `${slice.label}: ${slice.value}`)
          .join(', ')}.`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-inset)"
          strokeWidth={thickness}
        />
        {total > 0 &&
          slices
            .filter((slice) => slice.value > 0)
            .map((slice) => {
              const length = (slice.value / total) * circumference;
              const dashOffset = -offset;
              offset += length;
              return (
                <circle
                  key={slice.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(length - 2, 0)} ${circumference - Math.max(length - 2, 0)}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                >
                  <title>{`${slice.label}: ${slice.value}`}</title>
                </circle>
              );
            })}
      </svg>
      <div className="donut__center">
        <span className="donut__value">{centerValue}</span>
        <span className="donut__label">{centerLabel}</span>
      </div>
    </div>
  );
}
