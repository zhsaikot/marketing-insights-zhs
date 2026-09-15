import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

const insights = [
  { title: 'Content velocity is paying off', detail: 'Publishing 2 more articles this month lifted non-brand clicks by 24%.', tone: 'positive' as const },
  { title: 'Three pages need attention', detail: 'Refreshing titles on your declining pages could recover an estimated 1.2k visits.', tone: 'warning' as const },
];

export function InsightsPanel() {
  return <Card title="Latest insights" action={<button className="text-button">View all</button>}><div className="insights-list">{insights.map((insight) => <article className="insight" key={insight.title}><div className="insight-heading"><Badge tone={insight.tone}>{insight.tone === 'positive' ? 'Opportunity' : 'Attention'}</Badge><span className="insight-date">Today</span></div><h3>{insight.title}</h3><p>{insight.detail}</p></article>)}</div></Card>;
}
