import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import {
  Search,
  RotateCw,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Globe,
  FileCode,
  Layers,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  Link2,
  Share2,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fetchWebsiteAudit, recheckSingleFault, getGradeColor, getSeverityBadge, getCategoryLabel, generateAuditPdf } from '../utils/audit';
import { getStoredClients, getActiveClientId, setActiveClientId } from '../utils/clients';
import type { WebsiteAuditReport, SeoFault } from '../types';

export function SiteAudit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clients = getStoredClients();
  const [selectedClientId, setSelectedClientId] = useState<string>(getActiveClientId());
  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const queryUrl = searchParams.get('url');
  const initialUrl = queryUrl || activeClient?.website || 'https://github.com';

  const [inputUrl, setInputUrl] = useState<string>(initialUrl);
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [report, setReport] = useState<WebsiteAuditReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'passed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFaults, setExpandedFaults] = useState<Record<string, boolean>>({});
  const [recheckingMap, setRecheckingMap] = useState<Record<string, boolean>>({});
  const [recheckFeedback, setRecheckFeedback] = useState<
    Record<string, { type: 'resolved' | 'failed'; message: string }>
  >({});
  const [recheckingAll, setRecheckingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const handleRecheckSingle = async (faultId: string) => {
    if (!currentUrl) return;
    setRecheckingMap((prev) => ({ ...prev, [faultId]: true }));
    try {
      const res = await recheckSingleFault(currentUrl, faultId);
      setReport(res.updatedReport);

      if (res.resolved) {
        setRecheckFeedback((prev) => ({
          ...prev,
          [faultId]: { type: 'resolved', message: 'Resolved! Passed 🎉' },
        }));
        setToastMessage({
          text: `Fixed! "${res.updatedFault?.title || 'Issue'}" is now verified as passed!`,
          type: 'success',
        });
      } else {
        setRecheckFeedback((prev) => ({
          ...prev,
          [faultId]: {
            type: 'failed',
            message: `Still unresolved (${(res.updatedFault?.severity || res.currentSeverity).toUpperCase()})`,
          },
        }));
      }

      setTimeout(() => {
        setRecheckFeedback((prev) => {
          const next = { ...prev };
          delete next[faultId];
          return next;
        });
      }, 5000);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Re-check failed:', err);
      setRecheckFeedback((prev) => ({
        ...prev,
        [faultId]: { type: 'failed', message: 'Re-check error' },
      }));
    } finally {
      setRecheckingMap((prev) => ({ ...prev, [faultId]: false }));
    }
  };

  const handleRecheckAll = async () => {
    if (!currentUrl) return;
    setRecheckingAll(true);
    try {
      const freshData = await fetchWebsiteAudit(currentUrl);
      setReport(freshData);
      setToastMessage({
        text: 'Live re-audit complete! All items and scores refreshed.',
        type: 'info',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Live re-audit failed:', err);
      setError(err.message || 'Failed to re-audit website.');
    } finally {
      setRecheckingAll(false);
    }
  };

  const runAudit = useCallback(async (targetUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWebsiteAudit(targetUrl);
      setReport(data);
      setCurrentUrl(data.url);
      setSearchParams({ url: data.url });
    } catch (err: any) {
      console.error('Audit failed:', err);
      setError(err.message || 'Failed to analyze website. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Initial load
  useEffect(() => {
    runAudit(initialUrl);
  }, []);

  const handleClientChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    setActiveClientId(newClientId);
    const chosen = clients.find((c) => c.id === newClientId);
    if (chosen?.website) {
      setInputUrl(chosen.website);
      runAudit(chosen.website);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    runAudit(inputUrl.trim());
  };

  const toggleExpand = (id: string) => {
    setExpandedFaults((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportPdf = () => {
    if (!report) return;
    generateAuditPdf(report, activeClient?.name);
  };

  // Filtered Faults
  const filteredFaults = report?.faults.filter((fault) => {
    if (severityFilter !== 'all' && fault.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && fault.category !== categoryFilter) return false;
    return true;
  }) || [];

  return (
    <div className="page-content" style={{ paddingBottom: '60px' }}>
      {/* Top Banner / Controller */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          background: 'var(--white)',
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--green)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={14} /> One-Click URL Analyzer
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>• Public Intelligence & SEO Audit</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              Instant Website Audit & Technical SEO Detector
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--muted)' }}>
              Enter any public website URL to instantly uncover on-page SEO faults, tracking tags, crawlability errors, and organic visibility estimates.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick Client Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>Client:</span>
              <select
                className="pill-select"
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                style={{ minWidth: '150px', fontSize: '13px' }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {report && (
              <button
                type="button"
                className="button button-secondary"
                onClick={handleExportPdf}
                style={{ height: '38px', gap: '6px', fontSize: '13px' }}
                title="Download White-Label PDF Report"
              >
                <Download size={15} /> Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Search URL Input Bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Globe
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
              }}
            />
            <input
              type="text"
              className="input"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter website URL (e.g. https://example.com or domain.com)"
              style={{ paddingLeft: '42px', height: '44px', fontSize: '14px' }}
            />
          </div>

          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
            style={{
              height: '44px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: 700,
              gap: '8px',
              minWidth: '170px',
            }}
          >
            {loading ? (
              <>
                <RotateCw size={16} className="spinning" /> Analyzing...
              </>
            ) : (
              <>
                <Search size={16} /> Run Deep Audit
              </>
            )}
          </button>
        </form>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '12.5px', color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 500 }}>Try quick sample:</span>
          {['https://github.com', 'https://wordpress.org', 'https://stripe.com'].map((sampleUrl) => (
            <button
              key={sampleUrl}
              type="button"
              onClick={() => {
                setInputUrl(sampleUrl);
                runAudit(sampleUrl);
              }}
              style={{
                background: 'var(--paper-soft)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {sampleUrl.replace('https://', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.08)',
            marginBottom: '24px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>Audit Failed</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--ink)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !report && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div
            className="spinning"
            style={{
              width: '40px',
              height: '40px',
              borderWidth: '3px',
              borderStyle: 'solid',
              borderColor: 'var(--line)',
              borderTopColor: 'var(--brand-green, #10b981)',
              borderRadius: '50%',
              margin: '0 auto 16px',
            }}
          />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
            Crawling and Auditing {inputUrl}...
          </h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
            Inspecting HTML tags, heading hierarchy, image ALT attributes, robots.txt, sitemap, and tracking tags.
          </p>
        </div>
      )}

      {/* Results View */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Executive KPI Cards */}
          <div className="metric-grid">
            {/* Card 1: Overall SEO Health Score */}
            <div className="sociafy-metric-card">
              <div className="sociafy-metric-top">
                <h4 className="sociafy-metric-label">SEO Health Score</h4>
                <div
                  className="sociafy-metric-badge green"
                  style={{
                    fontWeight: 800,
                    fontSize: '15px',
                    letterSpacing: '-0.5px',
                  }}
                  title={`Overall Grade: ${report.grade}`}
                >
                  {report.grade}
                </div>
              </div>
              <div className="sociafy-metric-bottom">
                <div className="sociafy-metric-row">
                  <span className="sociafy-metric-value">{report.overallScore}</span>
                  <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>/ 100</span>
                  <span
                    className={`sociafy-pill-trend ${report.overallScore >= 80 ? 'up' : report.overallScore >= 60 ? 'neutral' : 'down'}`}
                    style={{ marginLeft: 'auto' }}
                  >
                    {report.overallScore >= 85
                      ? 'Grade A+'
                      : report.overallScore >= 75
                      ? 'Grade B'
                      : report.overallScore >= 60
                      ? 'Grade C'
                      : 'Needs Work'}
                  </span>
                </div>
                <span className="sociafy-metric-sub">
                  Audit took {(report.fetchTimeMs / 1000).toFixed(2)}s • {report.summary.totalChecks} checks
                </span>
              </div>
            </div>

            {/* Card 2: Critical Issues */}
            <div
              className="sociafy-metric-card"
              onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
              style={{
                cursor: 'pointer',
                borderColor: severityFilter === 'critical' ? '#ef4444' : undefined,
                boxShadow: severityFilter === 'critical' ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined,
              }}
              title="Click to filter Critical issues"
            >
              <div className="sociafy-metric-top">
                <h4 className="sociafy-metric-label">Critical Issues</h4>
                <div className="sociafy-metric-badge red">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="sociafy-metric-bottom">
                <div className="sociafy-metric-row">
                  <span
                    className="sociafy-metric-value"
                    style={{ color: report.summary.criticalCount > 0 ? '#ef4444' : undefined }}
                  >
                    {report.summary.criticalCount}
                  </span>
                  <span
                    className={`sociafy-pill-trend ${report.summary.criticalCount === 0 ? 'up' : 'down'}`}
                    style={{ marginLeft: 'auto' }}
                  >
                    {report.summary.criticalCount === 0 ? 'All Clear' : 'Urgent'}
                  </span>
                </div>
                <span className="sociafy-metric-sub">Immediate attention required</span>
              </div>
            </div>

            {/* Card 3: SEO Warnings */}
            <div
              className="sociafy-metric-card"
              onClick={() => setSeverityFilter(severityFilter === 'warning' ? 'all' : 'warning')}
              style={{
                cursor: 'pointer',
                borderColor: severityFilter === 'warning' ? '#f59e0b' : undefined,
                boxShadow: severityFilter === 'warning' ? '0 0 0 2px rgba(245, 158, 11, 0.25)' : undefined,
              }}
              title="Click to filter Warnings"
            >
              <div className="sociafy-metric-top">
                <h4 className="sociafy-metric-label">SEO Warnings</h4>
                <div className="sociafy-metric-badge amber">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="sociafy-metric-bottom">
                <div className="sociafy-metric-row">
                  <span
                    className="sociafy-metric-value"
                    style={{ color: report.summary.warningCount > 0 ? '#f59e0b' : undefined }}
                  >
                    {report.summary.warningCount}
                  </span>
                  <span className="sociafy-pill-trend neutral" style={{ marginLeft: 'auto' }}>
                    {report.summary.warningCount} to improve
                  </span>
                </div>
                <span className="sociafy-metric-sub">Optimization opportunities</span>
              </div>
            </div>

            {/* Card 4: Passed Checks */}
            <div
              className="sociafy-metric-card"
              onClick={() => setSeverityFilter(severityFilter === 'passed' ? 'all' : 'passed')}
              style={{
                cursor: 'pointer',
                borderColor: severityFilter === 'passed' ? 'var(--green)' : undefined,
                boxShadow: severityFilter === 'passed' ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : undefined,
              }}
              title="Click to filter Passed checks"
            >
              <div className="sociafy-metric-top">
                <h4 className="sociafy-metric-label">Passed Checks</h4>
                <div className="sociafy-metric-badge green">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="sociafy-metric-bottom">
                <div className="sociafy-metric-row">
                  <span className="sociafy-metric-value" style={{ color: 'var(--green)' }}>
                    {report.summary.passedCount}
                  </span>
                  <span className="sociafy-pill-trend up" style={{ marginLeft: 'auto' }}>
                    {Math.round((report.summary.passedCount / report.summary.totalChecks) * 100)}% Pass
                  </span>
                </div>
                <span className="sociafy-metric-sub">Working as best practice</span>
              </div>
            </div>
          </div>

          {/* Section 2: Detected Marketing Tech Stack & Key Elements */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Tech Stack Box */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Layers size={18} color="var(--brand-green, #10b981)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                  Detected Marketing & Tracking Stack
                </h3>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--muted)' }}>
                Scanned scripts and HTML headers to detect active tracking tools, analytics pixels, and CMS platforms:
              </p>

              {report.techStack.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--paper-soft)', borderRadius: '10px', fontSize: '13px', color: 'var(--muted)' }}>
                  No major 3rd-party tracking pixels or CMS detected in standard HTML markup.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {report.techStack.map((tech, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--paper-soft)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--brand-green, #10b981)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <FileCode size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                            {tech.name}
                          </div>
                          {tech.details && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{tech.details}</div>
                          )}
                        </div>
                      </div>
                      {tech.id && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--white)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                          }}
                        >
                          {tech.id}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Schema Types */}
              {report.schemaTypes.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                    Schema.org Structured Data:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {report.schemaTypes.map((schema, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: '11.5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: '#8b5cf6',
                          fontWeight: 500,
                        }}
                      >
                        {schema}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Technical Vitals Box */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={18} color="var(--brand-green, #10b981)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                  On-Page Health & Content Metrics
                </h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--paper-soft)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Content Word Count</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    {report.overview.wordCount.toLocaleString()} words
                  </div>
                  <div style={{ fontSize: '11px', color: report.overview.wordCount > 300 ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                    {report.overview.wordCount > 300 ? '✓ Healthy depth' : '⚠ Thin text content'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--paper-soft)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Images & ALT Tags</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    {report.overview.imageCount} total
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: report.overview.imagesMissingAlt === 0 ? '#10b981' : '#ef4444',
                      marginTop: '2px',
                    }}
                  >
                    {report.overview.imagesMissingAlt === 0
                      ? '✓ All have ALT text'
                      : `⚠ ${report.overview.imagesMissingAlt} missing ALT`}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--paper-soft)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Internal Links</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    {report.overview.internalLinksCount} links
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    + {report.overview.externalLinksCount} outbound
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--paper-soft)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Crawl Files</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '12px' }}>
                    <span style={{ color: report.overview.hasRobotsTxt ? '#10b981' : '#f59e0b' }}>
                      {report.overview.hasRobotsTxt ? '✓ robots.txt' : '✗ robots.txt'}
                    </span>
                    <span style={{ color: report.overview.hasSitemap ? '#10b981' : '#f59e0b' }}>
                      {report.overview.hasSitemap ? '✓ sitemap.xml' : '✗ sitemap.xml'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    SSL: {report.overview.hasSsl ? '🟢 Secure HTTPS' : '🔴 Insecure HTTP'}
                  </div>
                </div>
              </div>

              {/* Estimated Organic Reach */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>
                    Estimated Monthly Organic Visits:
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                    ~{report.estimatedMetrics.estimatedMonthlyVisits} visits/mo
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Keyword Reach Potential</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                    {report.estimatedMetrics.potentialKeywordReach}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Interactive Google SERP & Social Sharing Previews */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Google SERP Snippet Preview */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Eye size={18} color="var(--brand-green, #10b981)" />
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  Google Search Snippet Preview (SERP)
                </h3>
              </div>
              <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                How this page appears when people search for it on Google:
              </p>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#202124', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <Globe size={13} color="#5f6368" />
                  <span style={{ color: '#5f6368' }}>{report.hostname}</span>
                  <span style={{ color: '#5f6368' }}>›</span>
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#1a0dab',
                    lineHeight: 1.3,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginBottom: '4px',
                  }}
                >
                  {report.overview.title || 'Untitled Page'}
                </div>
                <div style={{ fontSize: '13px', color: '#4d5156', lineHeight: 1.45 }}>
                  {report.overview.description || 'No meta description provided. Google will extract random text snippets from the page content.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                <span>Title Length: {report.overview.title.length} chars</span>
                <span>Meta Description: {report.overview.description.length} chars</span>
              </div>
            </div>

            {/* Social Share (Open Graph) Preview */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Share2 size={18} color="var(--brand-green, #10b981)" />
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  Social Media Preview (Facebook / LinkedIn)
                </h3>
              </div>
              <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                Card thumbnail generated when sharing the URL on social platforms:
              </p>

              <div
                style={{
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  overflow: 'hidden',
                  background: 'var(--paper-soft)',
                }}
              >
                {report.socialPreview.ogImage ? (
                  <img
                    src={report.socialPreview.ogImage}
                    alt="Social Preview"
                    style={{
                      width: '100%',
                      height: '140px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: '110px',
                      background: 'var(--paper)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--muted)',
                      fontSize: '13px',
                    }}
                  >
                    No Open Graph Image (og:image) Configured
                  </div>
                )}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
                    {report.hostname}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: '2px 0 4px 0' }}>
                    {report.socialPreview.ogTitle || report.overview.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineClamp: 2 }}>
                    {report.socialPreview.ogDescription || report.overview.description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Detailed SEO Faults & Action Items */}
          <div className="card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                  SEO Faults & Actionable Recommendations
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                  Detailed checklist of critical issues, warnings, and passed validations with fix guides.
                </p>
              </div>

              {/* Filter Controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <div className="pill-segmented-control" style={{ margin: 0 }}>
                  <button
                    type="button"
                    className={`pill-segmented-btn ${severityFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSeverityFilter('all')}
                  >
                    All ({report.faults.length})
                  </button>
                  <button
                    type="button"
                    className={`pill-segmented-btn ${severityFilter === 'critical' ? 'active' : ''}`}
                    onClick={() => setSeverityFilter('critical')}
                    style={
                      severityFilter === 'critical'
                        ? { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }
                        : {}
                    }
                  >
                    🔴 Critical ({report.summary.criticalCount})
                  </button>
                  <button
                    type="button"
                    className={`pill-segmented-btn ${severityFilter === 'warning' ? 'active' : ''}`}
                    onClick={() => setSeverityFilter('warning')}
                    style={
                      severityFilter === 'warning'
                        ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }
                        : {}
                    }
                  >
                    🟡 Warnings ({report.summary.warningCount})
                  </button>
                  <button
                    type="button"
                    className={`pill-segmented-btn ${severityFilter === 'passed' ? 'active' : ''}`}
                    onClick={() => setSeverityFilter('passed')}
                  >
                    🟢 Passed ({report.summary.passedCount})
                  </button>
                </div>

                <select
                  className="pill-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ fontSize: '12px' }}
                >
                  <option value="all">All Categories</option>
                  <option value="meta">Meta & Content</option>
                  <option value="headings">Headings Hierarchy</option>
                  <option value="images">Image SEO</option>
                  <option value="indexability">Indexability & Robots</option>
                  <option value="security">Security & SSL</option>
                  <option value="social">Social Tags</option>
                </select>

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleRecheckAll}
                  disabled={recheckingAll}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    gap: '6px',
                  }}
                  title="Re-fetch live website and recheck all audit rules"
                >
                  <RotateCw size={13} className={recheckingAll ? 'spinning' : ''} />
                  {recheckingAll ? 'Re-checking Live Site...' : '⚡ Re-check All'}
                </button>
              </div>
            </div>

            {/* Faults List */}
            {filteredFaults.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13.5px' }}>
                No audit items match your current filter settings.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredFaults.map((fault) => {
                  const badge = getSeverityBadge(fault.severity);
                  const isExpanded = !!expandedFaults[fault.id];
                  const hasDetails = fault.details && (Array.isArray(fault.details) ? fault.details.length > 0 : true);

                  return (
                    <div
                      key={fault.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '12px',
                        background: 'var(--paper-soft)',
                        border: `1px solid ${badge.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: badge.bg,
                              color: badge.color,
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {fault.severity === 'critical' && <AlertCircle size={12} />}
                            {fault.severity === 'warning' && <AlertTriangle size={12} />}
                            {fault.severity === 'passed' && <CheckCircle2 size={12} />}
                            {badge.label}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'var(--white)',
                              color: 'var(--muted)',
                              border: '1px solid var(--line)',
                            }}
                          >
                            {getCategoryLabel(fault.category)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {recheckFeedback[fault.id] && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '11px',
                                fontWeight: 700,
                                background:
                                  recheckFeedback[fault.id].type === 'resolved'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                                color:
                                  recheckFeedback[fault.id].type === 'resolved' ? '#10b981' : '#ef4444',
                                border:
                                  recheckFeedback[fault.id].type === 'resolved'
                                    ? '1px solid rgba(16, 185, 129, 0.3)'
                                    : '1px solid rgba(239, 68, 68, 0.3)',
                                animation: 'fadeIn 0.2s ease',
                              }}
                            >
                              {recheckFeedback[fault.id].message}
                            </span>
                          )}

                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => handleRecheckSingle(fault.id)}
                            disabled={recheckingMap[fault.id]}
                            style={{
                              height: '28px',
                              padding: '0 10px',
                              fontSize: '11.5px',
                              gap: '5px',
                              borderRadius: 'var(--radius-pill)',
                              borderColor: 'var(--line)',
                              cursor: 'pointer',
                            }}
                            title="Re-check live site to see if this issue has been fixed"
                          >
                            <RotateCw
                              size={12}
                              className={recheckingMap[fault.id] ? 'spinning' : ''}
                            />
                            {recheckingMap[fault.id] ? 'Re-checking...' : 'Re-check'}
                          </button>

                          {hasDetails && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(fault.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                padding: '4px 6px',
                              }}
                            >
                              {isExpanded ? (
                                <>
                                  Hide Items <ChevronUp size={14} />
                                </>
                              ) : (
                                <>
                                  View Affected Items <ChevronDown size={14} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                        {fault.title}
                      </div>

                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                        {fault.description}
                      </p>

                      <div
                        style={{
                          marginTop: '6px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'var(--white)',
                          border: '1px solid var(--line)',
                          fontSize: '12.5px',
                          color: 'var(--ink)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}
                      >
                        <Sparkles size={15} color="var(--brand-green, #10b981)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Action Plan:</strong> {fault.recommendation}
                        </div>
                      </div>

                      {/* Expanded Details List */}
                      {isExpanded && hasDetails && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            background: 'var(--paper)',
                            border: '1px dashed var(--line)',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>
                            Affected Elements / Evidence:
                          </div>
                          {Array.isArray(fault.details) ? (
                            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--muted)' }}>
                              {fault.details.map((item, dIdx) => (
                                <li key={dIdx} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>
                                  {typeof item === 'string' ? item : JSON.stringify(item)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <pre style={{ margin: 0, color: 'var(--ink)', fontSize: '11px', overflowX: 'auto' }}>
                              {JSON.stringify(fault.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Floating Success / Action Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            padding: '12px 20px',
            borderRadius: 'var(--radius-pill)',
            background: toastMessage.type === 'success' ? 'var(--green-gradient)' : 'var(--white)',
            color: toastMessage.type === 'success' ? '#ffffff' : 'var(--ink)',
            border: toastMessage.type === 'success' ? 'none' : '1px solid var(--line)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          <Sparkles size={16} />
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
