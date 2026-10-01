import type { PageSpeedReport, PageSpeedSummary } from '../types';

export async function fetchPageSpeedReport(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile',
  force: boolean = false
): Promise<PageSpeedReport> {
  const params = new URLSearchParams({
    url,
    strategy,
    ...(force ? { force: 'true' } : {}),
  });

  const response = await fetch(`/api/pagespeed?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to audit URL`);
  }

  return response.json();
}

export async function fetchPageSpeedSummary(url: string): Promise<PageSpeedSummary> {
  const params = new URLSearchParams({ url });
  const response = await fetch(`/api/pagespeed/summary?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch summary`);
  }

  return response.json();
}

export function getScoreCategory(score: number): 'good' | 'needs-improvement' | 'poor' {
  if (score >= 90) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--green-accent)';
  if (score >= 50) return '#f59e0b'; // amber
  return 'var(--coral)'; // coral/red
}

export function formatTimeAgo(timestamp: string | number): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
