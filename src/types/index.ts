export type Page = 'dashboard' | 'clients' | 'integrations' | 'reports' | 'profile' | 'performance' | 'audit';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  company: string;
  verified: boolean;
  avatar?: string;
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
  clicks?: number;
  impressions?: number;
}

export type DateRangeKey = '7d' | '30d' | '90d' | '12m';

export interface ClientEntity {
  id: string;
  name: string;
  website: string;
  propertyId?: string;
  logo?: string;
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
    spend?: string;
    roas?: string;
  };
}

export interface OAuthTokenInfo {
  provider: 'google' | 'meta';
  accessToken: string;
  refreshToken?: string;
  account?: string;
  expiresAt?: number;
  scopes?: string[];
  connectedAt: string;
}

export interface MetaAdMetrics {
  spend: string;
  impressions: string;
  clicks: string;
  roas: string;
  cpc: string;
  conversions: string;
}

export interface GscMetrics {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: string;
  avgPosition: string;
}

export interface CoreWebVitalMetric {
  id: string;
  name: string;
  acronym: string;
  value: string;
  numericValue: number;
  score: number;
  status: 'good' | 'needs-improvement' | 'poor';
  thresholdText: string;
  description: string;
}

export interface AuditOpportunity {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  savingsMs?: number;
  savingsBytes?: number;
  score: number;
}

export interface PageSpeedReport {
  url: string;
  finalUrl: string;
  strategy: 'mobile' | 'desktop';
  performanceScore: number;
  timestamp: string;
  fetchTime: number;
  cached: boolean;
  cacheExpiresAt: number;
  cacheAgeMinutes?: number;
  cacheRemainingMinutes?: number;
  stale?: boolean;
  simulated?: boolean;
  coreWebVitals: {
    lcp: CoreWebVitalMetric;
    cls: CoreWebVitalMetric;
    fcp: CoreWebVitalMetric;
    ttfb: CoreWebVitalMetric;
    tbt: CoreWebVitalMetric;
    inp?: CoreWebVitalMetric;
    speedIndex?: CoreWebVitalMetric;
  };
  opportunities: AuditOpportunity[];
  diagnostics: AuditOpportunity[];
}

export interface PageSpeedSummary {
  url: string;
  mobile: {
    score: number;
    lcp?: CoreWebVitalMetric;
    cls?: CoreWebVitalMetric;
  };
  desktop: {
    score: number;
    lcp?: CoreWebVitalMetric;
    cls?: CoreWebVitalMetric;
  };
  lastChecked: string;
  cached: boolean;
}

export interface SeoFault {
  id: string;
  category: 'meta' | 'headings' | 'images' | 'indexability' | 'security' | 'social' | 'links' | 'performance';
  severity: 'critical' | 'warning' | 'passed';
  title: string;
  description: string;
  recommendation: string;
  details?: string[] | Record<string, any>;
}

export interface DetectedTech {
  name: string;
  category: 'analytics' | 'tag_manager' | 'advertising' | 'cms' | 'frontend' | 'security';
  id?: string;
  icon?: string;
  details?: string;
}

export interface WebsiteAuditReport {
  url: string;
  finalUrl: string;
  hostname: string;
  auditTime: string;
  fetchTimeMs: number;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  summary: {
    criticalCount: number;
    warningCount: number;
    passedCount: number;
    totalChecks: number;
  };
  overview: {
    title: string;
    description: string;
    h1: string;
    wordCount: number;
    imageCount: number;
    imagesMissingAlt: number;
    internalLinksCount: number;
    externalLinksCount: number;
    hasSsl: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    canonicalUrl: string | null;
    robotsMeta: string | null;
  };
  socialPreview: {
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    ogUrl: string | null;
    twitterCard: string | null;
    twitterImage: string | null;
  };
  techStack: DetectedTech[];
  schemaTypes: string[];
  faults: SeoFault[];
  estimatedMetrics: {
    visibilityScore: number;
    estimatedMonthlyVisits: string;
    potentialKeywordReach: string;
    onPageSeoHealth: string;
  };
}

