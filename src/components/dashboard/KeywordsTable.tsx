import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import type { KeywordRow } from '../../types';

const keywords: KeywordRow[] = [
  { keyword: 'technical seo audit', position: 3, volume: '8,100', traffic: '12.8%', change: 2 },
  { keyword: 'seo reporting dashboard', position: 5, volume: '5,400', traffic: '9.6%', change: 1 },
  { keyword: 'content performance', position: 8, volume: '3,600', traffic: '6.2%', change: -2 },
  { keyword: 'marketing insights', position: 11, volume: '2,900', traffic: '4.9%', change: 4 },
];

export function KeywordsTable() {
  return <Card title="Top keywords" action={<Badge tone="neutral">Last 7 days</Badge>}><Table><thead><tr><th>Keyword</th><th>Position</th><th>Volume</th><th>Traffic share</th><th>Change</th></tr></thead><tbody>{keywords.map((row) => <tr key={row.keyword}><td><strong>{row.keyword}</strong></td><td>#{row.position}</td><td>{row.volume}</td><td>{row.traffic}</td><td><span className={row.change > 0 ? 'trend trend-up' : 'trend trend-down'}>{row.change > 0 ? '+' : ''}{row.change}</span></td></tr>)}</tbody></Table></Card>;
}
