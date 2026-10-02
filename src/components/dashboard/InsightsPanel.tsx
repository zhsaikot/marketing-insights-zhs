import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Sparkles, X, Filter } from 'lucide-react';

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

  const activeInsights = defaultInsights.filter((item) => !dismissed.includes(item.id));
  const filtered = activeInsights.filter(
    (item) => (filter === 'all' ? true : item.category === filter)
  );

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--brand)" />
          <span>Automated Intelligence</span>
        </div>
      }
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Modern Pill Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              className="pill-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              aria-label="Filter automated intelligence"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Insights ({activeInsights.length})</option>
              <option value="win">Growth Wins</option>
              <option value="opportunity">SEO Opportunities</option>
              <option value="warning">Attention Needed</option>
            </select>
          </div>

          {dismissed.length > 0 && (
            <button
              type="button"
              className="button button-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: 'var(--radius-pill)' }}
              onClick={() => setDismissed([])}
              title="Restore all dismissed insights"
            >
              Restore ({dismissed.length})
            </button>
          )}
        </div>
      }
    >
      <div className="insights-list">
        {filtered.length > 0 ? (
          filtered.map((insight) => (
            <article className={`insight insight-${insight.category}`} key={insight.id}>
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
                    className="icon-circle-btn"
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--muted)',
                    }}
                    title="Dismiss insight"
                    onClick={() => setDismissed([...dismissed, insight.id])}
                    aria-label={`Dismiss ${insight.title}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              <h3>{insight.title}</h3>
              <p>{insight.detail}</p>
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: insight.category === 'warning' ? 'var(--coral)' : 'var(--green)',
                  }}
                >
                  Impact: {insight.impact}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 16px',
              color: 'var(--muted)',
              fontSize: '13px',
              background: 'var(--paper-soft)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Sparkles size={24} color="var(--brand)" style={{ marginBottom: '8px', opacity: 0.6 }} />
            <p style={{ margin: 0, fontWeight: 500 }}>
              {dismissed.length === defaultInsights.length
                ? 'All automated insights have been reviewed.'
                : `No "${filter}" insights found for this period.`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
