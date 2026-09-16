import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import type { KeywordRow } from '../../types';

export function KeywordsTable({ rows }: { rows: KeywordRow[] }) {
  return <Card title="Top keywords" action={<Badge tone="neutral">Last 7 days</Badge>}><Table><thead><tr><th>Keyword</th><th>Position</th><th>Volume</th><th>Traffic share</th><th>Change</th></tr></thead><tbody>{rows.map((row) => <tr key={row.keyword}><td><strong>{row.keyword}</strong></td><td>#{row.position}</td><td>{row.volume}</td><td>{row.traffic}</td><td><span className={row.change > 0 ? 'trend trend-up' : 'trend trend-down'}>{row.change > 0 ? '+' : ''}{row.change}</span></td></tr>)}</tbody></Table></Card>;
}
