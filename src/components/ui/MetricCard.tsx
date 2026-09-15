import type { Metric } from '../../types';
import { Card } from './Card';

export function MetricCard({ metric }: { metric: Metric }) {
  return <Card className="metric-card">
    <p className="eyebrow">{metric.label}</p>
    <strong className="metric-value">{metric.value}</strong>
    <span className={`trend trend-${metric.trend}`}>{metric.trend === 'up' ? '+' : ''}{metric.change} vs last period</span>
  </Card>;
}
