export type Page = 'dashboard' | 'clients' | 'integrations' | 'reports' | 'profile';

export type UserRole = 'agency' | 'client';

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  company: string;
  verified: boolean;
}

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
