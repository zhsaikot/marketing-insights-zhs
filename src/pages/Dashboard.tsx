import { useEffect, useState, useCallback } from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { TrafficChart } from '../components/dashboard/TrafficChart';
import { InsightsPanel } from '../components/dashboard/InsightsPanel';
import { KeywordsTable } from '../components/dashboard/KeywordsTable';
import { Card } from '../components/ui/Card';
import { Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  fetchAnalyticsReport,
  isDemoModeActive,
  setDemoModeActive,
  type AnalyticsReport,
} from '../utils/analytics';
import type { DateRangeKey } from '../types';
import { generateDynamicPdfReport } from '../utils/pdf-generator';
import { getStoredClients, getActiveClientId } from '../utils/clients';
import { PageSpeedWidget } from '../components/dashboard/PageSpeedWidget';

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

  const handleDownloadPdf = () => {
    const clients = getStoredClients();
    const activeId = getActiveClientId();
    const activeClient = clients.find((c) => c.id === activeId) || clients[0];

    generateDynamicPdfReport(
      {
        id: `dashboard-export-${Date.now()}`,
        title: 'Executive Performance Summary',
        type: 'Executive Summary',
        clientId: activeClient?.id || 'client-1',
        clientName: activeClient?.name || 'Acme Commerce',
        createdAt: new Date().toISOString().split('T')[0],
        dateRange: report?.dateRangeLabel || 'Last 30 days',
        status: 'ready',
        metricsSummary: {
          sessions: report?.metrics[0]?.value || '142,500',
          conversions: report?.metrics[1]?.value || '4,890',
          activeUsers: report?.metrics[2]?.value || '108,300',
          avgDuration: '2m 45s',
        },
      },
      report
    );
  };

  const handleExportCsv = () => {
    if (!report) return;
    const rows = [
      ['Metric', 'Value', 'Change', 'Trend'],
      ...report.metrics.map((m) => [m.label, m.value, m.change, m.trend]),
      [],
      ['Top Keywords', 'Position', 'Clicks', 'Impressions', 'Traffic Share', 'Intent'],
      ...report.keywords.map((k) => [
        k.keyword,
        k.position.toString(),
        (k.clicks || 0).toString(),
        (k.impressions || 0).toString(),
        k.traffic,
        k.intent,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketing-insights-${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasGoogle = Boolean(report?.tokens?.google);
  const hasMeta = Boolean(report?.tokens?.meta);

  return (
    <div className="page-content">
      {/* Top Page Intro Header (Sociafy Style) */}
      <div className="page-intro">
        <div>
          <h2>Social & Omnichannel Analytics</h2>
          <p className="muted">
            Track performance, engagement, and growth across all your marketing channels in one unified place.
          </p>
        </div>

        {/* Top Right Actions (Sociafy Export & Primary Action Button) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleExportCsv}
            title="Download metrics as CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={handleDownloadPdf}
            title="Generate executive PDF report"
          >
            <FileText size={15} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Pipeline Status & Segmented Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--white)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '22px',
          flexWrap: 'wrap',
        }}
      >
        {/* Channel Segmented Control (Pill Switcher) */}
        <div className="pill-segmented-control">
          <button
            type="button"
            className={`pill-segmented-btn ${channelTab === 'blended' ? 'active' : ''}`}
            onClick={() => setChannelTab('blended')}
          >
            All Channels
          </button>
          <button
            type="button"
            className={`pill-segmented-btn ${channelTab === 'organic' ? 'active' : ''}`}
            onClick={() => setChannelTab('organic')}
          >
            Organic (GA4 + GSC)
          </button>
          <button
            type="button"
            className={`pill-segmented-btn ${channelTab === 'meta' ? 'active' : ''}`}
            onClick={() => setChannelTab('meta')}
          >
            Meta Ads
          </button>
        </div>

        {/* Right Status Indicators & Timeframe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {hasGoogle || isDemo ? (
                <CheckCircle2 size={14} color="var(--green-accent)" />
              ) : (
                <AlertCircle size={14} color="var(--coral)" />
              )}
              <strong style={{ color: 'var(--ink)' }}>GA4 & GSC:</strong>
              <span style={{ color: 'var(--muted)' }}>
                {hasGoogle ? 'Live Token' : isDemo ? 'Sandbox Feed' : 'Not Connected'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {hasMeta || isDemo ? (
                <CheckCircle2 size={14} color="var(--green-accent)" />
              ) : (
                <AlertCircle size={14} color="var(--coral)" />
              )}
              <strong style={{ color: 'var(--ink)' }}>Meta Ads:</strong>
              <span style={{ color: 'var(--muted)' }}>
                {hasMeta ? 'Live Token' : isDemo ? 'Sandbox Feed' : 'Not Connected'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`badge ${isDemo ? 'badge-warning' : 'badge-positive'}`}
            style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '11px', border: 0 }}
            onClick={() => toggleDemo(!isDemo)}
          >
            {isDemo ? '✦ Demo Sandbox' : '● Live Multi-API Feed'}
          </button>

          {/* Timeframe Select Pill */}
          <select
            className="pill-select"
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
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <p>Syncing analytics across pipeline...</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Sociafy Style 4-Column KPI Metric Cards */}
          <div className="metric-grid">
            {report.metrics.map((metric, idx) => (
              <MetricCard key={metric.label} metric={metric} index={idx} />
            ))}
          </div>

          {/* Google PageSpeed Insights & Core Web Vitals Summary */}
          <PageSpeedWidget />

          {/* Meta Ads Specific Section */}
          {channelTab === 'meta' && report.metaMetrics && (
            <Card style={{ marginBottom: '22px' }}>
              <div className="card-header">
                <h2>Meta Paid Campaign Performance</h2>
                <span className="badge badge-positive">Active Campaign Feed</span>
              </div>
              <div className="meta-campaign-grid">
                <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Total Ad Spend</span>
                  <strong style={{ fontSize: '22px', display: 'block', margin: '6px 0', color: 'var(--ink)' }}>
                    {report.metaMetrics.spend}
                  </strong>
                  <span className="sociafy-pill-trend up">+18.4% vs last period</span>
                </div>
                <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Purchase ROAS</span>
                  <strong style={{ fontSize: '22px', display: 'block', margin: '6px 0', color: 'var(--ink)' }}>
                    {report.metaMetrics.roas}
                  </strong>
                  <span className="sociafy-pill-trend up">Target: 3.5x</span>
                </div>
                <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Ad Clicks</span>
                  <strong style={{ fontSize: '22px', display: 'block', margin: '6px 0', color: 'var(--ink)' }}>
                    {report.metaMetrics.clicks}
                  </strong>
                  <span className="sociafy-pill-trend neutral">CPC: {report.metaMetrics.cpc}</span>
                </div>
                <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Paid Conversions</span>
                  <strong style={{ fontSize: '22px', display: 'block', margin: '6px 0', color: 'var(--ink)' }}>
                    {report.metaMetrics.conversions}
                  </strong>
                  <span className="sociafy-pill-trend up">+14.2% vs target</span>
                </div>
              </div>
            </Card>
          )}

          {/* Traffic Chart & Insights Panel (2-Column Grid) */}
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
