import type { ReportEntity } from '../types';

const REPORTS_STORAGE_KEY = 'marketing-insights-reports-list';

export const initialReports: ReportEntity[] = [
  {
    id: 'rep-1',
    title: 'Monthly Performance Review (Acme Commerce)',
    type: 'Monthly Review',
    clientId: 'client-1',
    clientName: 'Acme Commerce',
    createdAt: '2026-09-18',
    dateRange: 'Aug 18, 2026 – Sep 17, 2026',
    status: 'ready',
    metricsSummary: {
      sessions: '142,500',
      conversions: '4,890',
      activeUsers: '108,300',
      avgDuration: '2m 45s',
    },
  },
  {
    id: 'rep-2',
    title: 'Q3 SEO Content Opportunities & Query Velocity',
    type: 'SEO Performance',
    clientId: 'client-1',
    clientName: 'Acme Commerce',
    createdAt: '2026-09-12',
    dateRange: 'Jun 01, 2026 – Sep 01, 2026',
    status: 'ready',
    metricsSummary: {
      sessions: '382,100',
      conversions: '14,200',
      activeUsers: '290,400',
      avgDuration: '3m 10s',
    },
  },
  {
    id: 'rep-3',
    title: 'Executive Channel Attribution & Paid vs Organic Audit',
    type: 'Executive Summary',
    clientId: 'client-2',
    clientName: 'Northwind Health',
    createdAt: '2026-09-05',
    dateRange: 'Aug 01, 2026 – Aug 31, 2026',
    status: 'ready',
    metricsSummary: {
      sessions: '68,200',
      conversions: '1,940',
      activeUsers: '51,800',
      avgDuration: '2m 15s',
    },
  },
];

export function getStoredReports(): ReportEntity[] {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(initialReports));
      return initialReports;
    }
    return JSON.parse(raw) as ReportEntity[];
  } catch {
    return initialReports;
  }
}

export function saveStoredReports(reports: ReportEntity[]): void {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save reports:', err);
  }
}

export function downloadReportCsv(report: ReportEntity): void {
  const csvContent = [
    ['Marketing Insights Report', report.title],
    ['Report Type', report.type],
    ['Client Account', report.clientName],
    ['Date Range', report.dateRange],
    ['Generated On', report.createdAt],
    [],
    ['Metric', 'Value'],
    ['Total Sessions', report.metricsSummary.sessions],
    ['Total Conversions', report.metricsSummary.conversions],
    ['Active Users', report.metricsSummary.activeUsers],
    ['Avg Session Duration', report.metricsSummary.avgDuration],
  ]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

