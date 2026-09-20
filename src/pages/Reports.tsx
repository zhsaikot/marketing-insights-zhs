import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  getStoredReports,
  saveStoredReports,
  downloadReportCsv,
} from '../utils/reports';
import { getStoredClients } from '../utils/clients';
import { fetchAnalyticsReport } from '../utils/analytics';
import { generateDynamicPdfReport } from '../utils/pdf-generator';
import type { ReportEntity, AuthUser } from '../types';

interface ReportsProps {
  user: AuthUser;
}

export function Reports({ user }: ReportsProps) {
  const isViewer = user.role === 'viewer';

  const [reports, setReports] = useState<ReportEntity[]>(getStoredReports);
  const clients = getStoredClients();

  const [showCreate, setShowCreate] = useState(false);
  const [viewReport, setViewReport] = useState<ReportEntity | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || 'client-1');
  const [reportType, setReportType] = useState<ReportEntity['type']>('Executive Summary');
  const [dateRange, setDateRange] = useState('Last 30 Days (Aug 20 - Sep 19, 2026)');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    if (!title.trim()) return;

    const client = clients.find((c) => c.id === clientId) || clients[0];

    const newReport: ReportEntity = {
      id: `rep-${Date.now()}`,
      title: title.trim(),
      type: reportType,
      clientId: client?.id || 'client-1',
      clientName: client?.name || 'Acme Commerce',
      createdAt: new Date().toISOString().split('T')[0],
      dateRange,
      status: 'ready',
      metricsSummary: {
        sessions: client ? client.monthlySessions : '84,500',
        conversions: client ? client.monthlyConversions : '2,640',
        activeUsers: '62,100',
        avgDuration: '2m 54s',
        spend: '$4,850',
        roas: '3.9x',
      },
    };

    const updated = [newReport, ...reports];
    setReports(updated);
    saveStoredReports(updated);
    setShowCreate(false);
    setTitle('');
  };

  const handleDelete = (reportId: string) => {
    if (isViewer) return;
    const updated = reports.filter((r) => r.id !== reportId);
    setReports(updated);
    saveStoredReports(updated);
    if (viewReport?.id === reportId) {
      setViewReport(null);
    }
  };

  const handleDownloadLivePdf = async (report: ReportEntity) => {
    setGeneratingPdf(report.id);
    try {
      const liveData = await fetchAnalyticsReport('30d');
      generateDynamicPdfReport(report, liveData);
    } catch (err) {
      console.error('Error fetching live data for PDF:', err);
      generateDynamicPdfReport(report, null);
    } finally {
      setGeneratingPdf(null);
    }
  };

  return (
    <div className="page-content">
      <div className="page-intro">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow" style={{ margin: 0 }}>Automated Reporting Suite</span>
            <Badge tone={isViewer ? 'warning' : 'positive'}>
              {isViewer ? 'Role: Viewer (Export Only)' : 'Role: Admin'}
            </Badge>
          </div>
          <h2>Performance Reports & Audits</h2>
          <p className="muted">
            Generate vector PDF deliverables and CSV audits powered by live multi-channel metrics.
          </p>
        </div>

        {!isViewer && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : '+ Create New Report'}
          </Button>
        )}
      </div>

      {showCreate && !isViewer && (
        <Card className="invite-card" title="Generate New Performance Report">
          <form className="invite-form" onSubmit={handleCreate}>
            <Input
              required
              placeholder="Report Title (e.g. Q3 Growth & Search Audit)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Report Title"
            />
            <select
              className="select"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              aria-label="Select Client"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportEntity['type'])}
              aria-label="Report Type"
            >
              <option value="Executive Summary">Executive Summary</option>
              <option value="SEO Performance">SEO Performance</option>
              <option value="Channel Attribution">Channel Attribution</option>
              <option value="Monthly Review">Monthly Review</option>
            </select>
            <Input
              placeholder="Date Range description"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Date Range"
            />
            <Button type="submit">Generate Report</Button>
          </form>
        </Card>
      )}

      {/* Reports List */}
      <Card>
        <div className="simple-list">
          {reports.map((report) => (
            <div className="simple-row" key={report.id} style={{ alignItems: 'center' }}>
              <div className="report-icon">{report.type.slice(0, 3).toUpperCase()}</div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{report.title}</strong>
                  <Badge tone={report.type === 'Executive Summary' ? 'positive' : 'neutral'}>
                    {report.type}
                  </Badge>
                </div>
                <span>
                  Client: <strong>{report.clientName}</strong> • {report.dateRange} • Created {report.createdAt}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button
                  onClick={() => handleDownloadLivePdf(report)}
                  disabled={generatingPdf === report.id}
                  title="Generate dynamic PDF with live GA4, GSC, and Meta metrics"
                >
                  {generatingPdf === report.id ? 'Generating...' : '📄 Download PDF'}
                </Button>
                <Button variant="secondary" onClick={() => setViewReport(report)}>
                  Preview
                </Button>
                <Button variant="ghost" onClick={() => downloadReportCsv(report)} title="Download CSV">
                  CSV
                </Button>
                {!isViewer && (
                  <button
                    type="button"
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: 'var(--coral)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px',
                    }}
                    onClick={() => handleDelete(report.id)}
                    title="Delete Report"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Report Preview Modal */}
      {viewReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 60, 53, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setViewReport(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(100%, 800px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              padding: '36px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '18px',
                marginBottom: '24px',
              }}
            >
              <div>
                <span className="eyebrow">{viewReport.type} • {viewReport.clientName}</span>
                <h2 style={{ margin: '6px 0', fontSize: '24px' }}>{viewReport.title}</h2>
                <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                  Period: {viewReport.dateRange} | Prepared on {viewReport.createdAt}
                </p>
              </div>
              <button
                type="button"
                style={{
                  border: 0,
                  background: 'transparent',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                }}
                onClick={() => setViewReport(null)}
              >
                ×
              </button>
            </div>

            {/* Executive Summary Callout */}
            <div
              style={{
                background: '#f4f9f6',
                borderLeft: '4px solid var(--green)',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '24px',
              }}
            >
              <strong style={{ color: 'var(--green)', display: 'block', marginBottom: '4px' }}>
                Executive Key Takeaways
              </strong>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
                Multi-channel metrics demonstrate sustained performance.
                Organic query visibility improved by 18.4% across Search Console queries, while Meta ad spend delivered a strong 3.9x ROAS return.
              </p>
            </div>

            {/* KPI Metric Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '28px',
              }}
            >
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Organic Sessions</span>
                <strong style={{ fontSize: '20px', display: 'block', marginTop: '6px' }}>
                  {viewReport.metricsSummary.sessions}
                </strong>
                <span className="trend trend-up" style={{ fontSize: '10px' }}>+18.4%</span>
              </div>
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Conversions</span>
                <strong style={{ fontSize: '20px', display: 'block', marginTop: '6px' }}>
                  {viewReport.metricsSummary.conversions}
                </strong>
                <span className="trend trend-up" style={{ fontSize: '10px' }}>+14.2%</span>
              </div>
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Active Users</span>
                <strong style={{ fontSize: '20px', display: 'block', marginTop: '6px' }}>
                  {viewReport.metricsSummary.activeUsers}
                </strong>
                <span className="trend trend-up" style={{ fontSize: '10px' }}>+16.7%</span>
              </div>
              <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Meta ROAS</span>
                <strong style={{ fontSize: '20px', display: 'block', marginTop: '6px' }}>
                  {viewReport.metricsSummary.roas || '3.9x'}
                </strong>
                <span className="trend trend-up" style={{ fontSize: '10px' }}>Spend: {viewReport.metricsSummary.spend || '$4,850'}</span>
              </div>
            </div>

            {/* Channel Breakdown Audit */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Channel Acquisition Share</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0' }}>Channel</th>
                    <th style={{ padding: '8px 0' }}>Sessions Share</th>
                    <th style={{ padding: '8px 0' }}>Conversion Rate</th>
                    <th style={{ padding: '8px 0' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #edf1ef' }}>
                    <td style={{ padding: '10px 0' }}><strong>Organic Search (GA4 + GSC)</strong></td>
                    <td style={{ padding: '10px 0' }}>54.2%</td>
                    <td style={{ padding: '10px 0' }}>3.8%</td>
                    <td style={{ padding: '10px 0' }}><span className="trend trend-up">+18%</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf1ef' }}>
                    <td style={{ padding: '10px 0' }}><strong>Paid Social (Meta Ads)</strong></td>
                    <td style={{ padding: '10px 0' }}>24.1%</td>
                    <td style={{ padding: '10px 0' }}>4.2%</td>
                    <td style={{ padding: '10px 0' }}><span className="trend trend-up">3.9x ROAS</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf1ef' }}>
                    <td style={{ padding: '10px 0' }}><strong>Direct Traffic</strong></td>
                    <td style={{ padding: '10px 0' }}>13.5%</td>
                    <td style={{ padding: '10px 0' }}>2.9%</td>
                    <td style={{ padding: '10px 0' }}><span className="trend trend-neutral">Steady</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 0' }}><strong>Referral & Partner Channels</strong></td>
                    <td style={{ padding: '10px 0' }}>8.2%</td>
                    <td style={{ padding: '10px 0' }}>5.1%</td>
                    <td style={{ padding: '10px 0' }}><span className="trend trend-up">+8%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--line)',
                paddingTop: '20px',
              }}
            >
              <span className="muted" style={{ fontSize: '12px' }}>
                Client Deliverable Document
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button onClick={() => handleDownloadLivePdf(viewReport)}>
                  📄 Download Live PDF
                </Button>
                <Button variant="secondary" onClick={() => downloadReportCsv(viewReport)}>
                  Download CSV
                </Button>
                <Button variant="ghost" onClick={() => setViewReport(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
