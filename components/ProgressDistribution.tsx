"use client";

type DistEntry = { label: string; value: number; color?: string };

export default function ProgressDistribution({ data }: { data: DistEntry[] }) {
  const total = Math.max(1, data.reduce((s, d) => s + Math.max(0, d.value), 0));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const palette = ["#7A2E2E", "#C9B8A8", "#9D9D9D", "#E4D8CE"];

  // Precompute segments with cumulative offsets without mutating after render
  const segments = data.map((d, i) => {
    const share = Math.max(0, d.value) / total;
    const len = share * circumference;
    const dashArray = `${len} ${circumference - len}`;
    const prevLen = data
      .slice(0, i)
      .reduce((acc, dd) => acc + (Math.max(0, dd.value) / total) * circumference, 0);
    return {
      color: d.color ?? palette[i % palette.length],
      dashArray,
      offset: -prevLen,
    };
  });
  return (
    <div className="flex items-center gap-3">
      <svg width={90} height={90} viewBox="0 0 90 90" role="img" aria-label="Distribution">
        <g transform="translate(45,45)">
          {segments.map((s, i) => (
            <circle
              key={`seg-${i}`}
              r={radius}
              cx={0}
              cy={0}
              fill="transparent"
              stroke={s.color}
              strokeWidth={12}
              strokeDasharray={s.dashArray}
              strokeDashoffset={s.offset}
              transform="rotate(-90)"
            />
          ))}
          {data.length === 0 ? (
            <circle r={radius} cx={0} cy={0} fill="transparent" stroke="#E4D8CE" strokeWidth={12} />
          ) : null}
        </g>
      </svg>
      <div className="space-y-1 text-xs text-[#2C2C2C]">
        {data.length === 0 ? (
          <div className="text-[#7A6455]">No data</div>
        ) : (
          data.map((d, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color ?? palette[i % palette.length] }} />
              <span>{d.label}</span>
              <span className="font-semibold">{Math.round((Math.max(0, d.value) / total) * 100)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
