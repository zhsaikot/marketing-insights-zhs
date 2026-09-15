import { Card } from '../ui/Card';

const points = [34, 42, 39, 53, 48, 64, 58, 69, 61, 75, 71, 84];

export function TrafficChart() {
  const chartPoints = points.map((value, index) => `${(index / (points.length - 1)) * 100},${100 - value}`).join(' ');
  return <Card title="Organic traffic" action={<select className="select" defaultValue="12 weeks"><option>12 weeks</option><option>6 weeks</option></select>}>
    <div className="chart-legend"><span><i className="legend-dot" /> Sessions</span><strong>184,290</strong><span className="trend trend-up">+18.4%</span></div>
    <div className="chart"><div className="chart-grid">{[0, 1, 2, 3].map((line) => <span key={line} />)}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Organic traffic trend"><polygon points={`0,100 ${chartPoints} 100,100`} /><polyline points={chartPoints} /></svg></div>
    <div className="chart-labels"><span>Jun 24</span><span>Jul 01</span><span>Jul 08</span><span>Jul 15</span><span>Jul 22</span></div>
  </Card>;
}
