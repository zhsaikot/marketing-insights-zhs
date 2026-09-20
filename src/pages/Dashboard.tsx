import { useEffect, useState, useCallback } from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { TrafficChart } from '../components/dashboard/TrafficChart';
import { InsightsPanel } from '../components/dashboard/InsightsPanel';
import { KeywordsTable } from '../components/dashboard/KeywordsTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  fetchAnalyticsReport,
  readAnalyticsConnection,
  isDemoModeActive,
  setDemoModeActive,
  type AnalyticsReport,
} from '../utils/analytics';
import type { DateRangeKey } from '../types';

export function Dashboard() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeKey>('30d');
  const [isDemo, setIsDemo] = useState(isDemoModeActive);

  const loadData = useCallback(
    async (range: DateRangeKey, forceDemo: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnalyticsReport(range, forceDemo);
        setReport(data);
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : 'Unable to load analytics data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(dateRange, isDemo);
  }, [loadData, dateRange, isDemo]);

  const toggleDemoMode = (demoState: boolean) => {
    setIsDemo(demoState);
    setDemoModeActive(demoState);
  };

  const connection = readAnalyticsConnection();

  return (
    <div className="page-content">
      <div className="page-intro">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow" style={{ margin: 0 }}>
              {isDemo ? 'Interactive Sandbox' : `GA4 Property: ${connection?.account || 'Not configured'}`}
            </span>
            <Badge tone={isDemo ? 'warning' : connection?.connected ? 'positive' : 'neutral'}>
              {isDemo ? 'Demo Mode Active' : connection?.connected ? 'Live GA4 Feed' : 'Offline'}
            </Badge>
          </div>
          <h2>Marketing performance</h2>
          <p className="muted">
            {isDemo
              ? 'Showing simulated growth analytics, organic search trends, and conversion metrics.'
              : 'Live performance metrics directly synchronized from your connected GA4 property.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <button
            type="button"
            className={`badge ${isDemo ? 'badge-warning' : 'badge-neutral'}`}
            style={{ padding: '8px 12px', cursor: 'pointer', border: '1px solid var(--line)' }}
            onClick={() => toggleDemoMode(!isDemo)}
            title="Toggle between sample data and live GA4 data"
          >
            {isDemo ? '✦ Switch to Live GA4' : '⇄ Switch to Demo Data'}
          </button>

          {/* Date Range Selector */}
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

      {/* Error / Connection Callout with instant Demo fallback */}
      {error && !isDemo && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            borderLeft: '4px solid var(--coral)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong style={{ color: 'var(--coral)', display: 'block', marginBottom: '4px' }}>
              Live connection required
            </strong>
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
              {error}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => toggleDemoMode(true)}>
              Preview with Demo Data
            </Button>
            <a href="/integrations" style={{ textDecoration: 'none' }}>
              <Button>Configure GA4</Button>
            </a>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
          <p>Syncing performance metrics...</p>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!loading && report && (
        <>
          <div className="metric-grid">
            {report.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className="dashboard-grid">
            <TrafficChart
              data={report.traffic}
              timeframe={dateRange}
              onTimeframeChange={(tf) => setDateRange(tf as DateRangeKey)}
            />
            <InsightsPanel />
          </div>

          <KeywordsTable rows={report.keywords} />
        </>
      )}
    </div>
  );
}
