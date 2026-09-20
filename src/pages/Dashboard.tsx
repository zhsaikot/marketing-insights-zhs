import { useEffect, useState, useCallback } from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { TrafficChart } from '../components/dashboard/TrafficChart';
import { InsightsPanel } from '../components/dashboard/InsightsPanel';
import { KeywordsTable } from '../components/dashboard/KeywordsTable';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  fetchAnalyticsReport,
  isDemoModeActive,
  setDemoModeActive,
  type AnalyticsReport,
} from '../utils/analytics';
import type { DateRangeKey } from '../types';

export function Dashboard() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeKey>('30d');
  const [channelTab, setChannelTab] = useState<'blended' | 'organic' | 'meta'>('blended');
  const [isDemo, setIsDemo] = useState(isDemoModeActive);

  const loadData = useCallback(
    async (range: DateRangeKey, forceDemo: boolean) => {
      setLoading(true);
      try {
        const data = await fetchAnalyticsReport(range, forceDemo);
        setReport(data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(dateRange, isDemo);
  }, [loadData, dateRange, isDemo]);

  const toggleDemo = (demoState: boolean) => {
    setIsDemo(demoState);
    setDemoModeActive(demoState);
  };

  const hasGoogle = Boolean(report?.tokens?.google);
  const hasMeta = Boolean(report?.tokens?.meta);

  return (
    <div className="page-content">
      {/* Live Pipeline Status Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 18px',
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: hasGoogle || isDemo ? 'var(--green)' : 'var(--coral)',
              }}
            />
            <strong>GA4 & Search Console:</strong>
            <span style={{ color: 'var(--muted)' }}>
              {hasGoogle ? 'Live Token Active' : isDemo ? 'Sandbox Connected' : 'Ready to Connect'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: hasMeta || isDemo ? 'var(--green)' : 'var(--coral)',
              }}
            />
            <strong>Meta Business:</strong>
            <span style={{ color: 'var(--muted)' }}>
              {hasMeta ? 'Live Token Active' : isDemo ? 'Sandbox Connected' : 'Ready to Connect'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={`badge ${isDemo ? 'badge-warning' : 'badge-positive'}`}
            style={{ cursor: 'pointer', border: '1px solid var(--line)', padding: '6px 12px' }}
            onClick={() => toggleDemo(!isDemo)}
          >
            {isDemo ? '✦ Demo Sandbox' : '● Live Multi-API Feed'}
          </button>
        </div>
      </div>

      <div className="page-intro">
        <div>
          <p className="eyebrow">Cross-Channel Analytics</p>
          <h2>Performance Overview</h2>
          <p className="muted">
            Aggregated marketing intelligence combining Google Analytics 4, Search Console, and Meta Business.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Channel Filter Switcher */}
          <div style={{ display: 'flex', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '6px', padding: '3px' }}>
            <button
              type="button"
              className={`badge ${channelTab === 'blended' ? 'badge-positive' : ''}`}
              style={{ border: 0, cursor: 'pointer', padding: '6px 12px' }}
              onClick={() => setChannelTab('blended')}
            >
              All Channels
            </button>
            <button
              type="button"
              className={`badge ${channelTab === 'organic' ? 'badge-positive' : ''}`}
              style={{ border: 0, cursor: 'pointer', padding: '6px 12px' }}
              onClick={() => setChannelTab('organic')}
            >
              Organic (GA4 + GSC)
            </button>
            <button
              type="button"
              className={`badge ${channelTab === 'meta' ? 'badge-positive' : ''}`}
              style={{ border: 0, cursor: 'pointer', padding: '6px 12px' }}
              onClick={() => setChannelTab('meta')}
            >
              Meta Ads
            </button>
          </div>

          {/* Timeframe Selector */}
          <select
            className="select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangeKey)}
            aria-label="Select Date Range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <p>Loading analytics data from connected APIs...</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Primary Metric Grid */}
          <div className="metric-grid">
            {report.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          {/* Meta Ads Specific Section */}
          {channelTab === 'meta' && report.metaMetrics && (
            <Card title="Meta Paid Campaign Performance" style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ padding: '12px', background: '#f8faf9', borderRadius: '6px' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Total Ad Spend</span>
                  <strong style={{ fontSize: '20px', display: 'block', margin: '4px 0' }}>
                    {report.metaMetrics.spend}
                  </strong>
                  <span className="trend trend-up">+18% vs last period</span>
                </div>
                <div style={{ padding: '12px', background: '#f8faf9', borderRadius: '6px' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Purchase ROAS</span>
                  <strong style={{ fontSize: '20px', display: 'block', margin: '4px 0' }}>
                    {report.metaMetrics.roas}
                  </strong>
                  <span className="trend trend-up">Target: 3.5x</span>
                </div>
                <div style={{ padding: '12px', background: '#f8faf9', borderRadius: '6px' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Ad Clicks</span>
                  <strong style={{ fontSize: '20px', display: 'block', margin: '4px 0' }}>
                    {report.metaMetrics.clicks}
                  </strong>
                  <span className="trend trend-neutral">CPC: {report.metaMetrics.cpc}</span>
                </div>
                <div style={{ padding: '12px', background: '#f8faf9', borderRadius: '6px' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Paid Conversions</span>
                  <strong style={{ fontSize: '20px', display: 'block', margin: '4px 0' }}>
                    {report.metaMetrics.conversions}
                  </strong>
                  <span className="trend trend-up">+14% vs target</span>
                </div>
              </div>
            </Card>
          )}

          {/* Traffic Chart & Insights Panel */}
          {channelTab !== 'meta' && (
            <div className="dashboard-grid">
              <TrafficChart
                data={report.traffic}
                timeframe={dateRange}
                onTimeframeChange={(tf) => setDateRange(tf as DateRangeKey)}
              />
              <InsightsPanel />
            </div>
          )}

          {/* High-Impact Keywords (Google Search Console) */}
          {channelTab !== 'meta' && <KeywordsTable rows={report.keywords} />}
        </>
      )}
    </div>
  );
}
