import { useEffect, useState } from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { TrafficChart } from '../components/dashboard/TrafficChart';
import { InsightsPanel } from '../components/dashboard/InsightsPanel';
import { KeywordsTable } from '../components/dashboard/KeywordsTable';
import { fetchAnalyticsReport, readAnalyticsConnection, type AnalyticsReport } from '../utils/analytics';

export function Dashboard() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsReport().then(setReport).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  const connection = readAnalyticsConnection();
  return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">GA4 property {connection?.account || 'not connected'}</p><h2>Marketing performance</h2><p className="muted">{loading ? 'Loading the latest data from Google Analytics.' : error || 'Live data from your connected analytics property.'}</p></div><button className="date-control">Last 30 days <span>v</span></button></div>{error && <div className="auth-message">{error}</div>}{!error && !loading && report && <><div className="metric-grid">{report.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><div className="dashboard-grid"><TrafficChart data={report.traffic} /><InsightsPanel /></div><KeywordsTable rows={report.keywords} /></>}{loading && <div className="auth-message">Loading analytics data...</div>}</div>;
}
