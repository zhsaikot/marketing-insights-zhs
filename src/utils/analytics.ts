export interface AnalyticsConnection {
  connected: boolean;
  method?: 'oauth' | 'api';
  account?: string;
}

export interface AnalyticsReport {
  metrics: Array<{ label: string; value: string; change: string; trend: 'up' | 'down' | 'neutral' }>;
  traffic: { points: number[]; total: string; change: string; labels: string[] };
  keywords: Array<{ keyword: string; position: number; volume: string; traffic: string; change: number }>;
}

const connectionStorageKey = 'marketing-insights-connections';

export function readAnalyticsConnection(): AnalyticsConnection | null {
  try {
    const connections = JSON.parse(localStorage.getItem(connectionStorageKey) || '{}') as Record<string, AnalyticsConnection>;
    const connection = connections['Google Analytics'];
    return connection?.connected && connection.account ? connection : null;
  } catch {
    return null;
  }
}

export async function fetchAnalyticsReport(): Promise<AnalyticsReport> {
  const connection = readAnalyticsConnection();
  if (!connection) throw new Error('Connect Google Analytics with a GA4 Property ID first.');

  const response = await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId: connection.account }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error || 'The analytics service could not load GA4 data.');
  }

  return response.json() as Promise<AnalyticsReport>;
}