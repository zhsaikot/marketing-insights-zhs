import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import {
  Gauge,
  Smartphone,
  Monitor,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  fetchPageSpeedReport,
  getScoreColor,
  getScoreCategory,
  getScoreLabel,
  formatTimeAgo,
} from '../utils/pagespeed';
import { getStoredClients, getActiveClientId, setActiveClientId } from '../utils/clients';
import type { PageSpeedReport, CoreWebVitalMetric } from '../types';

export function Performance() {
  const clients = getStoredClients();
  const [selectedClientId, setSelectedClientId] = useState<string>(getActiveClientId());
  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const [targetUrl, setTargetUrl] = useState<string>(activeClient?.website || 'https://acmecommerce.io');
  const [customInputUrl, setCustomInputUrl] = useState<string>(targetUrl);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [report, setReport] = useState<PageSpeedReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when active client changes
  const handleClientChange = (newId: string) => {
    setSelectedClientId(newId);
    setActiveClientId(newId);
    const chosen = clients.find((c) => c.id === newId);
    if (chosen?.website) {
      setTargetUrl(chosen.website);
      setCustomInputUrl(chosen.website);
    }
  };

  const loadAudit = useCallback(
    async (urlToAudit: string, currentStrategy: 'mobile' | 'desktop', force: boolean = false) => {
      if (force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await fetchPageSpeedReport(urlToAudit, currentStrategy, force);
        setReport(data);
      } catch (err: any) {
        console.error('Failed to fetch PageSpeed audit:', err);
        setError(err?.message || 'Failed to load PageSpeed Insights data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAudit(targetUrl, strategy, false);
  }, [loadAudit, targetUrl, strategy]);

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInputUrl.trim()) {
      setTargetUrl(customInputUrl.trim());
    }
  };

  const handleForceRefresh = () => {
    loadAudit(targetUrl, strategy, true);
  };

  const score = report?.performanceScore ?? 0;
  const scoreColor = getScoreColor(score, strategy);
  const scoreCategory = getScoreCategory(score, strategy);

  // Compute circular progress offset for gauge
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const renderStatusBadge = (status: 'good' | 'needs-improvement' | 'poor') => {
    if (status === 'good') {
      return (
        <span className="badge badge-positive" style={{ gap: '4px', fontSize: '11px', padding: '3px 8px' }}>
          <CheckCircle2 size={12} /> Good
        </span>
      );
    }
    if (status === 'needs-improvement') {
      return (
        <span className="badge badge-warning" style={{ gap: '4px', fontSize: '11px', padding: '3px 8px' }}>
          <AlertTriangle size={12} /> Needs Work
        </span>
      );
    }
    return (
      <span className="badge badge-danger" style={{ gap: '4px', fontSize: '11px', padding: '3px 8px' }}>
        <AlertCircle size={12} /> Poor
      </span>
    );
  };

  const renderMetricCard = (metric?: CoreWebVitalMetric) => {
    if (!metric) return null;
    return (
      <div
        key={metric.id}
        style={{
          background: 'var(--white)',
          padding: '20px',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <span className="eyebrow" style={{ margin: 0, fontSize: '11px' }}>
                {metric.acronym}
              </span>
              <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                {metric.name}
              </h4>
            </div>
            {renderStatusBadge(metric.status)}
          </div>

          <div style={{ margin: '14px 0 8px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: metric.status === 'good' ? 'var(--green-accent)' : metric.status === 'needs-improvement' ? '#f59e0b' : 'var(--coral)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {metric.value}
            </span>
          </div>

          <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.45' }}>
            {metric.description}
          </p>
        </div>

        <div
          style={{
            paddingTop: '10px',
            borderTop: '1px dashed var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--muted)',
          }}
        >
          <span>Target threshold:</span>
          <strong style={{ color: 'var(--ink)' }}>{metric.thresholdText || 'Optimized'}</strong>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      {/* Top Header / Page Intro */}
      <div className="page-intro">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2>PageSpeed & Core Web Vitals</h2>
            <span className="badge badge-positive" style={{ fontSize: '11px', gap: '4px' }}>
              <Zap size={11} /> Google Lighthouse PSI
            </span>
          </div>
          <p className="muted">
            Automated performance audits with 2-hour caching for <strong>{activeClient?.name}</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Client Selector Dropdown */}
          <select
            className="pill-select"
            value={selectedClientId}
            onChange={(e) => handleClientChange(e.target.value)}
            aria-label="Select Client"
            style={{ fontWeight: 600 }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.website.replace(/^https?:\/\//, '')})
              </option>
            ))}
          </select>

          {/* Force Re-check button */}
          <button
            type="button"
            className="button button-primary"
            onClick={handleForceRefresh}
            disabled={refreshing || loading}
            title="Bypass 2-hour cache and fetch fresh data from Google"
          >
            <RotateCw size={14} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Auditing Google PSI...' : 'Force Re-check'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: URL bar + Mobile/Desktop switch */}
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
        {/* URL Form */}
        <form onSubmit={handleCustomUrlSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '260px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: '440px',
            }}
          >
            <input
              type="url"
              className="sociafy-search-input"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              placeholder="https://example.com"
              style={{ width: '100%', paddingLeft: '14px', fontSize: '13px', height: '36px' }}
            />
          </div>
          <button
            type="submit"
            className="button button-secondary"
            style={{ height: '36px', padding: '0 14px', fontSize: '12px' }}
          >
            Audit URL
          </button>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-ghost"
            style={{ height: '36px', padding: '0 10px' }}
            title="Open website in new tab"
          >
            <ExternalLink size={14} />
          </a>
        </form>

        {/* Strategy Switcher + Cache Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Mobile vs Desktop segmented control */}
          <div className="pill-segmented-control">
            <button
              type="button"
              className={`pill-segmented-btn ${strategy === 'mobile' ? 'active' : ''}`}
              onClick={() => setStrategy('mobile')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Smartphone size={14} />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              className={`pill-segmented-btn ${strategy === 'desktop' ? 'active' : ''}`}
              onClick={() => setStrategy('desktop')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Monitor size={14} />
              <span>Desktop</span>
            </button>
          </div>

          {/* Cache Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--muted)',
              background: 'var(--paper-soft)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            <Clock size={13} color="var(--brand-green)" />
            <span>
              {report?.cached
                ? `Cached (${report.cacheAgeMinutes || 0}m ago • Refreshes in ${report.cacheRemainingMinutes || 120}m)`
                : 'Live PSI Audit'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 20px',
            marginBottom: '20px',
            color: 'var(--coral)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} />
          <div>
            <strong>Audit Notice:</strong> {error}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
          <div className="spinning" style={{ display: 'inline-block', marginBottom: '12px' }}>
            <RotateCw size={32} color="var(--brand-green)" />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink)' }}>
            Running Google Lighthouse Audit for {strategy.toUpperCase()}...
          </p>
          <p style={{ fontSize: '13px' }}>Evaluating Core Web Vitals, FCP, LCP, CLS, and page diagnostics.</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Main Hero Card: Lighthouse Score & High-Level Summary */}
          <Card style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '32px',
                alignItems: 'center',
              }}
              className="performance-hero-grid"
            >
              {/* Circular SVG Gauge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                  <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="75"
                      cy="75"
                      r={radius}
                      stroke="var(--paper-soft)"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="75"
                      cy="75"
                      r={radius}
                      stroke={scoreColor}
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '38px',
                        fontWeight: 700,
                        color: scoreColor,
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1,
                      }}
                    >
                      {score}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Lighthouse
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  {scoreCategory === 'perfect' ? (
                    <span
                      className="badge badge-positive"
                      style={{
                        padding: '4px 12px',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        gap: '5px',
                        fontWeight: 700,
                      }}
                    >
                      <Sparkles size={12} /> {strategy === 'mobile' ? 'Perfect (85-100)' : 'Perfect (95-100)'}
                    </span>
                  ) : scoreCategory === 'good' ? (
                    <span className="badge badge-positive" style={{ padding: '4px 12px', gap: '5px' }}>
                      <CheckCircle2 size={12} /> {strategy === 'mobile' ? 'Good (70-84)' : 'Good (90-94)'}
                    </span>
                  ) : scoreCategory === 'needs-improvement' ? (
                    <span className="badge badge-warning" style={{ padding: '4px 12px', gap: '5px' }}>
                      <AlertTriangle size={12} /> {strategy === 'mobile' ? 'Needs Work (50-69)' : 'Needs Work (50-89)'}
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ padding: '4px 12px', gap: '5px' }}>
                      <AlertCircle size={12} /> Poor (0-49)
                    </span>
                  )}
                </div>
              </div>

              {/* High-Level Narrative Details */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                    {strategy} Environment
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Audited {formatTimeAgo(report.timestamp)}
                  </span>
                  {report.simulated && (
                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                      Simulated Preview
                    </span>
                  )}
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: 'var(--ink)' }}>
                  {scoreCategory === 'perfect'
                    ? `Outstanding ${strategy === 'mobile' ? 'Mobile' : 'Desktop'} Speed — Perfect Score!`
                    : scoreCategory === 'good'
                    ? `Good ${strategy === 'mobile' ? 'Mobile' : 'Desktop'} Performance — Passes Targets (${strategy === 'mobile' ? '70+' : '90+'})`
                    : scoreCategory === 'needs-improvement'
                    ? 'Average User Experience — Optimizations Available'
                    : 'Suboptimal Speed — Immediate Attention Recommended'}
                </h3>

                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5', maxWidth: '640px' }}>
                  {scoreCategory === 'perfect'
                    ? `The website ${report.url} delivers industry-leading loading and responsiveness, surpassing all Core Web Vitals thresholds for ${strategy} users.`
                    : scoreCategory === 'good'
                    ? `The website ${report.url} delivers good responsiveness above ${strategy === 'mobile' ? '70/100' : '90/100'} and provides a smooth browsing experience for ${strategy} visitors.`
                    : scoreCategory === 'needs-improvement'
                    ? `Core Web Vitals reveal opportunities to improve time-to-first-byte, optimize heavy JavaScript execution, and streamline critical rendering path assets.`
                    : `Significant blocking resources and rendering delays are impacting user experience and potential search ranking signals.`}
                </p>

                {/* Score Scale Legend with Strategy-Specific Conditions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                  {strategy === 'mobile' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>85-100 Perfect</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                        <span style={{ color: 'var(--ink)' }}>70-84 Good</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                        <span style={{ color: 'var(--ink)' }}>50-69 Needs Work</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--coral)' }} />
                        <span style={{ color: 'var(--ink)' }}>0-49 Poor</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>95-100 Perfect</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                        <span style={{ color: 'var(--ink)' }}>90-94 Good</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                        <span style={{ color: 'var(--ink)' }}>50-89 Needs Work</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--coral)' }} />
                        <span style={{ color: 'var(--ink)' }}>0-49 Poor</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Core Web Vitals Grid (6 Cards) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
                  Core Web Vitals Assessment
                </h3>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                  Field and lab measurements used by Google Search ranking algorithms.
                </p>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                75th Percentile Evaluation
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {renderMetricCard(report.coreWebVitals.lcp)}
              {renderMetricCard(report.coreWebVitals.cls)}
              {renderMetricCard(report.coreWebVitals.fcp)}
              {renderMetricCard(report.coreWebVitals.ttfb)}
              {renderMetricCard(report.coreWebVitals.tbt)}
              {renderMetricCard(report.coreWebVitals.speedIndex || report.coreWebVitals.inp)}
            </div>
          </div>

          {/* Actionable Opportunities & Diagnostics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              gap: '20px',
              marginBottom: '24px',
            }}
            className="performance-details-grid"
          >
            {/* Optimization Opportunities */}
            <Card>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--brand-green)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Actionable Opportunities</h3>
                    <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                      Suggested optimizations to reduce page load time
                    </p>
                  </div>
                </div>
                <span className="badge badge-positive" style={{ fontSize: '11px' }}>
                  {report.opportunities.length} suggestions
                </span>
              </div>

              {report.opportunities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: '13px' }}>
                  <ShieldCheck size={28} color="var(--green-accent)" style={{ margin: '0 auto 8px' }} />
                  <p>Great job! No critical render-blocking opportunities detected.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {report.opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--paper-soft)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{opp.title}</strong>
                        {opp.displayValue && (
                          <span
                            className="badge badge-warning"
                            style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px' }}
                          >
                            {opp.displayValue}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: '1.45' }}>
                        {opp.description.replace(/\[Learn more\].*$/i, '')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Diagnostic Signals & SEO Health */}
            <Card>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="var(--brand-green)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Diagnostics & Signals</h3>
                    <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                      Underlying web performance indicators
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {report.diagnostics.length > 0 ? (
                  report.diagnostics.map((diag) => (
                    <div
                      key={diag.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--paper-soft)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{diag.title}</span>
                        {diag.displayValue && (
                          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                            {diag.displayValue}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                        {diag.description.replace(/\[Learn more\].*$/i, '')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: '13px' }}>
                    All diagnostics evaluated within normal parameters.
                  </div>
                )}

                {/* Audit Cache Guarantee Note */}
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    background: 'rgba(13, 118, 86, 0.05)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--brand-green)',
                    fontSize: '12px',
                    color: 'var(--brand-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <TrendingUp size={16} />
                  <span>
                    Auto-refreshes every 2 hours to avoid Google PSI rate-limits while keeping reports up-to-date.
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
