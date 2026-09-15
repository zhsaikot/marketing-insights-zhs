import { MetricCard } from '../components/ui/MetricCard';
import { TrafficChart } from '../components/dashboard/TrafficChart';
import { InsightsPanel } from '../components/dashboard/InsightsPanel';
import { KeywordsTable } from '../components/dashboard/KeywordsTable';
import type { Metric } from '../types';

const metrics: Metric[] = [
  { label: 'Organic sessions', value: '184,290', change: '18.4%', trend: 'up' },
  { label: 'Conversions', value: '8,642', change: '12.8%', trend: 'up' },
  { label: 'Avg. position', value: '14.6', change: '2.1%', trend: 'up' },
  { label: 'Visibility score', value: '68.4', change: '0.8%', trend: 'down' },
];

export function Dashboard() {
  return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Jul 16 - Jul 22, 2024</p><h2>Good morning, Ziaul.</h2><p className="muted">Here is what changed across your marketing portfolio this week.</p></div><button className="date-control">This week <span>v</span></button></div><div className="metric-grid">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><div className="dashboard-grid"><TrafficChart /><InsightsPanel /></div><KeywordsTable /></div>;
}
