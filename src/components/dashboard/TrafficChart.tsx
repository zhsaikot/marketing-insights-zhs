import { useState } from 'react';
import { Card } from '../ui/Card';
import { TrendingUp } from 'lucide-react';

interface TrafficChartProps {
  data: {
    points: number[];
    total: string;
    change: string;
    labels: string[];
    avgDaily?: number;
    peakValue?: number;
  };
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

// Converts data points to a smooth cubic bezier spline SVG path
function generateSmoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  let d = `M ${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? i : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

export function TrafficChart({ data, timeframe = '30d', onTimeframeChange }: TrafficChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const rawPoints = data.points && data.points.length > 0 ? data.points : [580, 520, 740, 690, 880, 820, 1040, 1180];
  const labels = data.labels && data.labels.length > 0 ? data.labels : rawPoints.map((_, i) => `W${i + 1}`);

  const min = Math.min(...rawPoints);
  const max = Math.max(...rawPoints);
  const range = max - min || 1;

  // Add 12% vertical padding at top and bottom so peaks & dips never hit the borders
  const coords = rawPoints.map((value, index) => {
    const x = rawPoints.length > 1 ? (index / (rawPoints.length - 1)) * 100 : 50;
    const normalized = (value - min) / range;
    const y = 82 - normalized * 64; // maps nicely between 18% and 82%
    return { x, y, value, label: labels[index] || `Point ${index + 1}` };
  });

  const pathD = generateSmoothPath(coords);
  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x.toFixed(2)},100 L ${coords[0].x.toFixed(2)},100 Z`
    : '';

  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <Card
      title="Traffic overview"
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="pill-select"
            value={timeframe}
            onChange={(e) => onTimeframeChange?.(e.target.value)}
            aria-label="Select timeframe"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
        </div>
      }
    >
      {/* Legend & Summary Bar */}
      <div className="chart-legend" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-accent)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '13px', fontWeight: 500 }}>
            Organic Sessions
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginLeft: 'auto' }}>
          <strong style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>
            {activeCoord ? activeCoord.value.toLocaleString() : data.total}
          </strong>
          <span className="sociafy-pill-trend up" style={{ gap: '3px' }}>
            <TrendingUp size={11} /> {data.change}
          </span>
          {data.avgDaily && !activeCoord ? (
            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '10px' }}>
              Daily Avg: <strong style={{ color: 'var(--ink)' }}>{data.avgDaily.toLocaleString()}</strong>
            </span>
          ) : null}
        </div>
      </div>

      {/* Main Chart Container */}
      <div
        className="chart-container-smooth"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Horizontal Dashed Grid Lines */}
        <div className="chart-grid-lines">
          {[0, 1, 2, 3].map((line) => (
            <span key={line} />
          ))}
        </div>

        {/* SVG Spline Path & Area Gradient */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Organic traffic trend curve"
          className="chart-svg-layer"
        >
          <defs>
            <linearGradient id="trafficGradientEmerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Smooth Area Gradient Fill */}
          <path d={areaD} fill="url(#trafficGradientEmerald)" />

          {/* Smooth Curved Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--brand-green)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Active Hover Vertical Crosshair */}
          {activeCoord && (
            <line
              x1={activeCoord.x}
              y1={5}
              x2={activeCoord.x}
              y2={95}
              stroke="rgba(16, 185, 129, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* 100% Round Dots (HTML Overlays — NEVER STRETCHED INTO OVALS!) */}
        <div className="chart-dots-layer">
          {coords.map((c, i) => (
            <div
              key={i}
              className={`chart-round-dot ${hoverIndex === i ? 'is-active' : ''}`}
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
              }}
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}
        </div>

        {/* Glassmorphic Floating Tooltip */}
        {activeCoord && (
          <div
            className="chart-floating-tooltip"
            style={{
              left: `${Math.min(Math.max(activeCoord.x, 14), 86)}%`,
              top: `${Math.max(activeCoord.y - 12, 10)}%`,
            }}
          >
            <div className="chart-tooltip-label">{activeCoord.label}</div>
            <div className="chart-tooltip-val">
              <strong>{activeCoord.value.toLocaleString()}</strong>
              <span>sessions</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom X-Axis Labels */}
      <div className="chart-labels-bar">
        {labels.map((label, idx) => (
          <span
            key={idx}
            className={hoverIndex === idx ? 'label-active' : ''}
          >
            {label}
          </span>
        ))}
      </div>
    </Card>
  );
}
