import { useState } from 'react';
import { Card } from '../ui/Card';

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

export function TrafficChart({ data, timeframe = '30d', onTimeframeChange }: TrafficChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = data.points && data.points.length > 0 ? data.points : [100, 150, 130, 200, 240, 310];
  const labels = data.labels && data.labels.length > 0 ? data.labels : points.map((_, i) => `P${i + 1}`);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  // Map points to SVG coordinates with top & bottom padding (top: 15, bottom: 85)
  const coords = points.map((value, index) => {
    const x = points.length > 1 ? (index / (points.length - 1)) * 100 : 50;
    const normalized = (value - min) / range;
    const y = 85 - normalized * 70; // maps to [15, 85]
    return { x, y, value, label: labels[index] || `Point ${index + 1}` };
  });

  const polylineStr = coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
  const polygonStr = `0,100 ${polylineStr} 100,100`;

  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <Card
      title="Traffic overview"
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="select"
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
      <div className="chart-legend">
        <span>
          <i className="legend-dot" /> Organic Sessions
        </span>
        <strong>{data.total}</strong>
        <span className={`trend ${data.change.startsWith('-') ? 'trend-down' : 'trend-up'}`}>
          {data.change}
        </span>
        {data.avgDaily ? (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--muted)' }}>
            Daily Avg: <strong>{data.avgDaily.toLocaleString()}</strong>
          </span>
        ) : null}
      </div>

      <div
        className="chart"
        style={{ position: 'relative', cursor: 'crosshair' }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <div className="chart-grid">
          {[0, 1, 2, 3].map((line) => (
            <span key={line} />
          ))}
        </div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Organic traffic trend"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--green)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <polygon points={polygonStr} fill="url(#chartGradient)" />
          <polyline
            points={polylineStr}
            fill="none"
            stroke="var(--green)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Interactive hover circle & guide */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hoverIndex === i ? 4 : 2}
              fill={hoverIndex === i ? 'var(--green)' : '#fff'}
              stroke="var(--green)"
              strokeWidth={hoverIndex === i ? 2 : 1.5}
              vectorEffect="non-scaling-stroke"
              style={{ transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {activeCoord && (
            <line
              x1={activeCoord.x}
              y1={10}
              x2={activeCoord.x}
              y2={95}
              stroke="var(--green)"
              strokeWidth="1"
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {activeCoord && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(Math.max(activeCoord.x, 12), 88)}%`,
              top: `${Math.max(activeCoord.y - 38, 4)}%`,
              transform: 'translate(-50%, -100%)',
              background: '#123c35',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '5px',
              fontSize: '11px',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <strong>{activeCoord.value.toLocaleString()}</strong> sessions
            <div style={{ fontSize: '9px', color: '#91cfb1' }}>{activeCoord.label}</div>
          </div>
        )}
      </div>

      <div className="chart-labels">
        {labels.length <= 12
          ? labels.map((label, idx) => <span key={idx}>{label}</span>)
          : labels
              .filter((_, idx) => idx % Math.ceil(labels.length / 8) === 0 || idx === labels.length - 1)
              .map((label, idx) => <span key={idx}>{label}</span>)}
      </div>
    </Card>
  );
}
