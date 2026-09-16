import { Card } from '../ui/Card';

export function TrafficChart({ data }: { data: { points: number[]; total: string; change: string; labels: string[] } }) {
  const points = data.points;
  const chartPoints = points.map((value, index) => `${(index / (points.length - 1)) * 100},${100 - value}`).join(' ');
  return <Card title="Organic traffic" action={<select className="select" defaultValue="12 weeks"><option>12 weeks</option><option>6 weeks</option></select>}>
    <div className="chart-legend"><span><i className="legend-dot" /> Sessions</span><strong>{data.total}</strong><span className="trend trend-up">{data.change}</span></div>
    <div className="chart"><div className="chart-grid">{[0, 1, 2, 3].map((line) => <span key={line} />)}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Organic traffic trend"><polygon points={`0,100 ${chartPoints} 100,100`} /><polyline points={chartPoints} /></svg></div>
    <div className="chart-labels">{data.labels.map((label) => <span key={label}>{label}</span>)}</div>
  </Card>;
}
