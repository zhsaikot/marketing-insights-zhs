export type Page = 'dashboard' | 'clients' | 'integrations' | 'reports';

export type Trend = 'up' | 'down' | 'neutral';

export interface Metric {
  label: string;
  value: string;
  change: string;
  trend: Trend;
}

export interface KeywordRow {
  keyword: string;
  position: number;
  volume: string;
  traffic: string;
  change: number;
}
