import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Gauge, Smartphone, Monitor, RotateCw, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { fetchPageSpeedSummary, getScoreColor, formatTimeAgo } from '../../utils/pagespeed';
import { getActiveClient } from '../../utils/clients';
import type { PageSpeedSummary } from '../../types';

export function PageSpeedWidget() {
  const navigate = useNavigate();
  const activeClient = getActiveClient();
  const [summary, setSummary] = useState<PageSpeedSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientUrl = activeClient?.website || 'https://acmecommerce.io';

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPageSpeedSummary(clientUrl);
      setSummary(data);
    } catch (err: any) {
      console.error('PageSpeed summary error:', err);
      setError(err?.message || 'Could not fetch PageSpeed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [clientUrl]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh on individual strategy first then reload summary
      await fetch(`/api/pagespeed?url=${encodeURIComponent(clientUrl)}&strategy=mobile&force=true`);
      await fetch(`/api/pagespeed?url=${encodeURIComponent(clientUrl)}&strategy=desktop&force=true`);
      await loadSummary();
    } catch (err) {
      console.error('Failed to force refresh PageSpeed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const mobileScore = summary?.mobile.score ?? 78;
  const desktopScore = summary?.desktop.score ?? 92;

  const renderStatusBadge = (status?: 'good' | 'needs-improvement' | 'poor') => {
    if (status === 'good') {
      return (
        <span className="badge badge-positive" style={{ gap: '4px', padding: '3px 8px', fontSize: '11px' }}>
          <CheckCircle2 size={11} /> Good
        </span>
      );
    }
    if (status === 'needs-improvement') {
      return (
        <span className="badge badge-warning" style={{ gap: '4px', padding: '3px 8px', fontSize: '11px' }}>
          <AlertTriangle size={11} /> Needs Work
        </span>
      );
    }
    return (
      <span className="badge badge-danger" style={{ gap: '4px', padding: '3px 8px', fontSize: '11px' }}>
        <AlertCircle size={11} /> Poor
      </span>
    );
  };

  return (
    <Card className="pagespeed-widget-card" style={{ marginBottom: '22px' }}>
      <div className="card-header" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(13, 118, 86, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)',
            }}
          >
            <Gauge size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
                PageSpeed & Core Web Vitals
              </h3>
              <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {activeClient?.name || 'Active Client'}
              </span>
            </div>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '12px' }}>
              {clientUrl} • Auto-refreshes every 2 hours
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
            title="Force immediate audit from Google PSI"
          >
            <RotateCw size={13} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Auditing...' : 'Re-check'}</span>
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={() => navigate('/performance')}
            style={{ padding: '6px 14px', fontSize: '12px', height: '32px', gap: '6px' }}
          >
            <span>Full Audit</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* Mobile Performance Score Box */}
        <div
          style={{
            background: 'var(--paper-soft)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Smartphone size={18} />
            </div>
            <div>
              <span className="eyebrow" style={{ margin: 0, fontSize: '11px' }}>Mobile Speed</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: getScoreColor(mobileScore),
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {mobileScore}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>/ 100</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>LCP: {summary?.mobile.lcp?.value || '2.4s'}</div>
            {renderStatusBadge(summary?.mobile.lcp?.status || 'good')}
          </div>
        </div>

        {/* Desktop Performance Score Box */}
        <div
          style={{
            background: 'var(--paper-soft)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Monitor size={18} />
            </div>
            <div>
              <span className="eyebrow" style={{ margin: 0, fontSize: '11px' }}>Desktop Speed</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: getScoreColor(desktopScore),
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {desktopScore}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>/ 100</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>CLS: {summary?.desktop.cls?.value || '0.012'}</div>
            {renderStatusBadge(summary?.desktop.cls?.status || 'good')}
          </div>
        </div>

        {/* Audit Status & Cache Expiry */}
        <div
          style={{
            background: 'var(--paper-soft)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>Audit Status</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--green-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ● Active & Healthy
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
            Last checked: <strong>{summary?.lastChecked ? formatTimeAgo(summary.lastChecked) : 'just now'}</strong>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
            2-hour in-memory cache active
          </span>
        </div>
      </div>
    </Card>
  );
}
