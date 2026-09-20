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
  helperText?: string;
}

export interface KeywordRow {
  keyword: string;
  position: number;
  volume: string;
  traffic: string;
  change: number;
  intent?: 'commercial' | 'informational' | 'navigational' | 'transactional';
}

export type DateRangeKey = '7d' | '30d' | '90d' | '12m';

export interface ClientEntity {
  id: string;
  name: string;
  website: string;
  propertyId?: string;
  status: 'healthy' | 'review' | 'attention';
  role: 'admin' | 'editor' | 'viewer';
  lastSynced: string;
  monthlySessions: string;
  monthlyConversions: string;
}

export interface ReportEntity {
  id: string;
  title: string;
  type: 'Executive Summary' | 'SEO Performance' | 'Channel Attribution' | 'Monthly Review';
  clientId: string;
  clientName: string;
  createdAt: string;
  dateRange: string;
  status: 'ready' | 'generating';
  metricsSummary: {
    sessions: string;
    conversions: string;
    activeUsers: string;
    avgDuration: string;
  };
}
