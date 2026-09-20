import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface InsightItem {
  id: string;
  category: 'win' | 'opportunity' | 'warning';
  title: string;
  detail: string;
  impact: string;
  date: string;
}

const defaultInsights: InsightItem[] = [
  {
    id: '1',
    category: 'win',
    title: 'Content velocity driving non-brand surge',
    detail: 'Publishing 3 targeted articles this month lifted organic search traffic by 24.3% across high-intent keywords.',
    impact: '+1,820 visits',
    date: 'Today',
  },
  {
    id: '2',
    category: 'opportunity',
    title: 'Striking-distance keywords ready for page 1',
    detail: '4 keywords ranking in positions 11-14 have high search volume. Adding internal links could push them to top 5.',
    impact: 'High upside',
    date: 'Yesterday',
  },
  {
    id: '3',
    category: 'warning',
    title: 'Mobile checkout page bounce rate elevated',
    detail: 'Average session duration on mobile checkout fell 18s compared to desktop users. Consider checking mobile load speed.',
    impact: 'Needs review',
    date: '2 days ago',
  },
];

export function InsightsPanel() {
  const [filter, setFilter] = useState<'all' | 'opportunity' | 'win' | 'warning'>('all');
  const [dismissed, setDismissed] = useState<string[]>([]);

  const filtered = defaultInsights
    .filter((item) => !dismissed.includes(item.id))
    .filter((item) => (filter === 'all' ? true : item.category === filter));

  return (
    <Card
      title="Automated intelligence"
      action={
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className="text-button"
            onClick={() => setFilter(filter === 'all' ? 'opportunity' : 'all')}
          >
            {filter === 'all' ? 'Filter' : 'Show all'}
          </button>
        </div>
      }
    >
      <div className="insights-list">
        {filtered.length > 0 ? (
          filtered.map((insight) => (
            <article className="insight" key={insight.id}>
              <div className="insight-heading">
                <Badge
                  tone={
                    insight.category === 'win'
                      ? 'positive'
                      : insight.category === 'opportunity'
                      ? 'neutral'
                      : 'warning'
                  }
                >
                  {insight.category === 'win'
                    ? 'Growth Win'
                    : insight.category === 'opportunity'
                    ? 'SEO Opportunity'
                    : 'Attention Needed'}
                </Badge>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="insight-date">{insight.date}</span>
                  <button
                    type="button"
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: 0,
                    }}
                    title="Dismiss insight"
                    onClick={() => setDismissed([...dismissed, insight.id])}
                  >
                    ×
                  </button>
                </div>
              </div>
              <h3>{insight.title}</h3>
              <p>{insight.detail}</p>
              <div
                style={{
                  marginTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: insight.category === 'warning' ? 'var(--coral)' : 'var(--green)',
                  }}
                >
                  Impact: {insight.impact}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)' }}>
            All insights reviewed for this period.
          </div>
        )}
      </div>
    </Card>
  );
}
