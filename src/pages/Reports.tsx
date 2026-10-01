import { useState, useMemo } from 'react';
import {
  getStoredReports,
  saveStoredReports,
  downloadReportCsv,
} from '../utils/reports';
import { getStoredClients } from '../utils/clients';
import { fetchAnalyticsReport } from '../utils/analytics';
import { generateDynamicPdfReport } from '../utils/pdf-generator';
import type { ReportEntity, AuthUser } from '../types';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';

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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || 'client-1');
  const [reportType, setReportType] = useState<ReportEntity['type']>('Executive Summary');
  const [dateRange, setDateRange] = useState('Last 30 Days (Aug 20 - Sep 19, 2026)');

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedType === 'all' || r.type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [reports, searchQuery, selectedType]);

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

  const getReportTheme = (type: string) => {
    switch (type) {
      case 'Executive Summary':
        return { class: 'executive', icon: FileText, color: 'var(--green)' };
      case 'SEO Performance':
        return { class: 'seo', icon: TrendingUp, color: 'var(--purple)' };
      case 'Channel Attribution':
        return { class: 'channel', icon: Layers, color: 'var(--blue)' };
      default:
        return { class: 'monthly', icon: Calendar, color: 'var(--yellow)' };
    }
  };

  return (
    <div className="page-content">
      {/* Top Page Intro Header (Sociafy Style) */}
      <div className="page-intro">
        <div>
          <h2>Executive Reports & Audits</h2>
          <p className="muted">
            Generate vector PDF client deliverables, export scheduled summaries, and analyze performance trends.
          </p>
        </div>

        {!isViewer && (
          <button
            type="button"
            className="button button-primary"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            <span>Create New Report</span>
          </button>
        )}
      </div>

      {/* 4 Sociafy-Style KPI Cards for Reports Suite */}
      <div className="reports-kpi-grid">
        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Generated Reports</h4>
            <div className="sociafy-metric-badge green">
              <FileText size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">{reports.length}</span>
              <span className="sociafy-pill-trend up">
                <CheckCircle2 size={12} /> Active
              </span>
            </div>
            <span className="sociafy-metric-sub">Client performance deliverables</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Client Coverage</h4>
            <div className="sociafy-metric-badge purple">
              <Building2 size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">{clients.length}</span>
              <span className="sociafy-pill-trend up">100%</span>
            </div>
            <span className="sociafy-metric-sub">Active brand workspaces</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">PDF Vector Engine</h4>
            <div className="sociafy-metric-badge blue">
              <Download size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">A4 Print</span>
              <span className="sociafy-pill-trend up">Live</span>
            </div>
            <span className="sociafy-metric-sub">Auto-calculated KPIs & tables</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Audit Types</h4>
            <div className="sociafy-metric-badge pink">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">4 Types</span>
              <span className="sociafy-pill-trend neutral">SEO • Meta • Exec</span>
            </div>
            <span className="sociafy-metric-sub">Multi-channel cross attribution</span>
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="reports-toolbar">
        {/* Search input with icon */}
        <div className="reports-search-box">
          <Search />
          <input
            type="text"
            className="reports-search-input"
            placeholder="Search reports by title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="pill-segmented-control">
          <button
            type="button"
            className={`pill-segmented-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            All Reports ({reports.length})
          </button>
          <button
            type="button"
            className={`pill-segmented-btn ${selectedType === 'executive summary' ? 'active' : ''}`}
            onClick={() => setSelectedType('executive summary')}
          >
            Executive
          </button>
          <button
            type="button"
            className={`pill-segmented-btn ${selectedType === 'seo performance' ? 'active' : ''}`}
            onClick={() => setSelectedType('seo performance')}
          >
            SEO
          </button>
          <button
            type="button"
            className={`pill-segmented-btn ${selectedType === 'monthly review' ? 'active' : ''}`}
            onClick={() => setSelectedType('monthly review')}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--white)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <FileText size={40} color="var(--muted-light)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--ink)' }}>No Reports Found</h3>
          <p className="muted" style={{ margin: 0 }}>
            {searchQuery
              ? `No reports matched your search query "${searchQuery}".`
              : 'Click "+ Create New Report" to generate your first audit deliverable.'}
          </p>
        </div>
      )}

      {/* Modern Sociafy-Inspired Report Cards Grid */}
      <div className="reports-card-grid">
        {filteredReports.map((report) => {
          const theme = getReportTheme(report.type);
          const Icon = theme.icon;

          return (
            <div key={report.id} className="report-item-card">
              <div>
                {/* Card Top: Icon Badge + Title + Status */}
                <div className="report-item-top">
                  <div className={`report-item-icon-badge ${theme.class}`}>
                    <Icon size={20} />
                  </div>
                  <div className="report-item-header">
                    <h3 className="report-item-title">{report.title}</h3>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        {report.type}
                      </span>
                      <span className="badge badge-positive" style={{ fontSize: '10px' }}>
                        ✓ Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Meta: Client & Date Range Chips */}
                <div className="report-item-meta">
                  <span className="report-meta-chip">
                    <Building2 size={13} color="var(--muted)" />
                    {report.clientName}
                  </span>
                  <span className="report-meta-chip">
                    <Calendar size={13} color="var(--muted)" />
                    {report.dateRange}
                  </span>
                </div>

                {/* Card Metric Box (4 Mini KPIs for Depth & Texture) */}
                <div className="report-metrics-box">
                  <div className="report-metric-stat">
                    <strong>{report.metricsSummary?.sessions || '142.5k'}</strong>
                    <span>Sessions</span>
                  </div>
                  <div className="report-metric-stat">
                    <strong>{report.metricsSummary?.conversions || '4.8k'}</strong>
                    <span>Conversions</span>
                  </div>
                  <div className="report-metric-stat">
                    <strong>{report.metricsSummary?.activeUsers || '108.3k'}</strong>
                    <span>Users</span>
                  </div>
                  <div className="report-metric-stat">
                    <strong style={{ color: 'var(--green)' }}>
                      {report.metricsSummary?.roas || '3.9x'}
                    </strong>
                    <span>Meta ROAS</span>
                  </div>
                </div>
              </div>

              {/* Card Actions Bottom */}
              <div className="report-item-actions">
                <div className="report-action-group">
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                    onClick={() => handleDownloadLivePdf(report)}
                    disabled={generatingPdf === report.id}
                    title="Generate vector PDF with live GA4, GSC, and Meta metrics"
                  >
                    <Download size={14} />
                    <span>{generatingPdf === report.id ? 'Generating...' : 'PDF'}</span>
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                    onClick={() => setViewReport(report)}
                    title="Preview report deliverable in browser"
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                    onClick={() => downloadReportCsv(report)}
                    title="Export report dataset as CSV"
                  >
                    CSV
                  </button>
                </div>

                {!isViewer && (
                  <button
                    type="button"
                    className="icon-circle-btn"
                    style={{ width: '34px', height: '34px', color: 'var(--coral)' }}
                    onClick={() => handleDelete(report.id)}
                    title="Delete report"
                    aria-label="Delete report"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Report Modern Modal Dialog */}
      {showCreate && !isViewer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(100%, 540px)',
              padding: '30px',
              borderRadius: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="sociafy-metric-badge green" style={{ width: '36px', height: '36px' }}>
                  <Sparkles size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                  Generate New Report
                </h3>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setShowCreate(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                  Report Title
                </label>
                <input
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Q3 Growth & Search Console Audit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                    Client Workspace
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                    Report Type
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportEntity['type'])}
                  >
                    <option value="Executive Summary">Executive Summary</option>
                    <option value="SEO Performance">SEO Performance</option>
                    <option value="Channel Attribution">Channel Attribution</option>
                    <option value="Monthly Review">Monthly Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                  Date Range Scope
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Create Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Report Preview Modal */}
      {viewReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setViewReport(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(100%, 820px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              padding: '36px',
              borderRadius: '24px',
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-positive">{viewReport.type}</span>
                  <span className="badge badge-neutral">{viewReport.clientName}</span>
                </div>
                <h2 style={{ margin: '4px 0 6px', fontSize: '24px', fontWeight: 800 }}>
                  {viewReport.title}
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                  Coverage: {viewReport.dateRange} • Generated on {viewReport.createdAt}
                </p>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                onClick={() => setViewReport(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Executive Summary Callout */}
            <div
              style={{
                background: '#ecfdf5',
                borderLeft: '4px solid var(--green)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
              }}
            >
              <strong style={{ color: 'var(--green)', display: 'block', marginBottom: '4px' }}>
                Executive Performance Summary
              </strong>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
                Multi-channel metrics demonstrate strong growth trajectory.
                Organic query visibility improved by 18.4% across Search Console queries, while Meta ad campaigns generated a solid 3.9x ROAS return.
              </p>
            </div>

            {/* KPI Metric Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px',
                marginBottom: '28px',
              }}
            >
              <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Organic Sessions</span>
                <strong style={{ fontSize: '22px', display: 'block', marginTop: '6px', color: 'var(--ink)' }}>
                  {viewReport.metricsSummary?.sessions || '142,500'}
                </strong>
                <span className="sociafy-pill-trend up">+18.4%</span>
              </div>
              <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Conversions</span>
                <strong style={{ fontSize: '22px', display: 'block', marginTop: '6px', color: 'var(--ink)' }}>
                  {viewReport.metricsSummary?.conversions || '4,890'}
                </strong>
                <span className="sociafy-pill-trend up">+14.2%</span>
              </div>
              <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Active Users</span>
                <strong style={{ fontSize: '22px', display: 'block', marginTop: '6px', color: 'var(--ink)' }}>
                  {viewReport.metricsSummary?.activeUsers || '108,300'}
                </strong>
                <span className="sociafy-pill-trend up">+16.7%</span>
              </div>
              <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span className="eyebrow" style={{ margin: 0 }}>Meta ROAS</span>
                <strong style={{ fontSize: '22px', display: 'block', marginTop: '6px', color: 'var(--green)' }}>
                  {viewReport.metricsSummary?.roas || '3.9x'}
                </strong>
                <span className="sociafy-pill-trend up">Spend: {viewReport.metricsSummary?.spend || '$4,850'}</span>
              </div>
            </div>

            {/* Channel Breakdown Audit */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--ink)' }}>
                Channel Attribution Breakdown
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Sessions Share</th>
                    <th>Conversion Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Organic Search (GA4 + GSC)</strong></td>
                    <td>54.2%</td>
                    <td>3.8%</td>
                    <td><span className="sociafy-pill-trend up">+18% growth</span></td>
                  </tr>
                  <tr>
                    <td><strong>Paid Social (Meta Ads)</strong></td>
                    <td>24.1%</td>
                    <td>4.2%</td>
                    <td><span className="sociafy-pill-trend up">3.9x ROAS</span></td>
                  </tr>
                  <tr>
                    <td><strong>Direct Traffic</strong></td>
                    <td>13.5%</td>
                    <td>2.9%</td>
                    <td><span className="sociafy-pill-trend neutral">Steady</span></td>
                  </tr>
                  <tr>
                    <td><strong>Referral & Partner Channels</strong></td>
                    <td>8.2%</td>
                    <td>5.1%</td>
                    <td><span className="sociafy-pill-trend up">+8%</span></td>
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
              <span className="muted" style={{ fontSize: '13px' }}>
                Client Deliverable Ready
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleDownloadLivePdf(viewReport)}
                >
                  <Download size={15} />
                  <span>Download Live PDF</span>
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => downloadReportCsv(viewReport)}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setViewReport(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
