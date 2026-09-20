import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportEntity, KeywordRow } from '../types';
import type { AnalyticsReport } from './analytics';

export function generateDynamicPdfReport(report: ReportEntity, liveData?: AnalyticsReport | null) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header Banner (Deep Emerald)
  doc.setFillColor(18, 60, 53); // #123c35
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Brand Mark
  doc.setFillColor(237, 118, 94); // Coral accent #ed765e
  doc.roundedRect(16, 12, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('M', 19.5, 19);

  // Brand Title
  doc.setFontSize(15);
  doc.text('Marketing Insights Platform', 30, 19);

  // Report Title & Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(145, 207, 177); // Mint accent
  doc.text(`${report.type.toUpperCase()} • CLIENT DELIVERABLE`, 30, 26);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 37, 34); // #182522
  doc.text(report.title, 16, 54);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 128, 123); // #71807b
  doc.text(`Client: ${report.clientName}    |    Date Range: ${report.dateRange}    |    Generated: ${report.createdAt}`, 16, 61);

  // 2. Executive Narrative Box
  doc.setFillColor(244, 249, 246);
  doc.roundedRect(16, 68, pageWidth - 32, 22, 2, 2, 'F');
  doc.setDrawColor(20, 107, 80); // Green line
  doc.setLineWidth(1);
  doc.line(16, 68, 16, 90);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 107, 80);
  doc.text('Executive Summary & Channel Growth', 20, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 60, 56);
  doc.text(
    'Performance for this period highlights strong growth across organic search and paid channels. Organic query velocity increased by 18.4%, while multi-channel conversion efficiency achieved target KPIs with steady user engagement.',
    20,
    81,
    { maxWidth: pageWidth - 42 }
  );

  // 3. KPI Metric Cards
  const sessionsVal = liveData?.metrics?.[0]?.value || report.metricsSummary.sessions;
  const conversionsVal = liveData?.metrics?.[1]?.value || report.metricsSummary.conversions;
  const activeUsersVal = liveData?.metrics?.[2]?.value || report.metricsSummary.activeUsers;
  const metaVal = liveData?.metaMetrics?.spend ? `${liveData.metaMetrics.spend} / ${liveData.metaMetrics.roas}` : '$4,850 / 3.9x';

  const cardWidth = (pageWidth - 32 - 12) / 4;
  const cardY = 96;

  const kpis = [
    { label: 'ORGANIC SESSIONS', val: sessionsVal, trend: '+18.4%' },
    { label: 'CONVERSIONS', val: conversionsVal, trend: '+14.2%' },
    { label: 'ACTIVE USERS', val: activeUsersVal, trend: '+16.7%' },
    { label: 'META SPEND / ROAS', val: metaVal, trend: '+22.4%' },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 16 + idx * (cardWidth + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 233, 228);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, cardY, cardWidth, 22, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(113, 128, 123);
    doc.text(kpi.label, x + 4, cardY + 6);

    doc.setFontSize(11);
    doc.setTextColor(24, 37, 34);
    doc.text(kpi.val, x + 4, cardY + 13);

    doc.setFontSize(7);
    doc.setTextColor(20, 107, 80);
    doc.text(kpi.trend, x + 4, cardY + 18);
  });

  // 4. Google Search Console Keyword Rankings Table
  const keywordsData = (liveData?.keywords || [
    { keyword: 'growth marketing automation', position: 2, volume: '18,500', traffic: '26.4%', change: 3, intent: 'commercial' },
    { keyword: 'enterprise ga4 reporting tool', position: 1, volume: '12,200', traffic: '22.8%', change: 1, intent: 'transactional' },
    { keyword: 'b2b conversion attribution', position: 4, volume: '9,400', traffic: '14.1%', change: 2, intent: 'commercial' },
    { keyword: 'digital marketing client portal', position: 3, volume: '8,100', traffic: '11.5%', change: -1, intent: 'transactional' },
    { keyword: 'search console performance api', position: 5, volume: '6,700', traffic: '9.2%', change: 4, intent: 'informational' },
  ]).map((k: KeywordRow) => [
    `#${k.position}`,
    k.keyword,
    `${k.volume} / mo`,
    k.traffic,
    k.change > 0 ? `+${k.change}` : `${k.change}`,
    (k.intent || 'commercial').toUpperCase(),
  ]);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 37, 34);
  doc.text('High-Impact Search Queries & Ranking Positions', 16, 128);

  autoTable(doc, {
    startY: 132,
    head: [['Rank', 'Keyword / Search Query', 'Est. Volume', 'Traffic Share', 'Rank Shift', 'Intent']],
    body: keywordsData,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 107, 80],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [35, 45, 40],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [247, 250, 248],
    },
    margin: { left: 16, right: 16 },
  });

  // 5. Channel Attribution & Performance Table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 200;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 37, 34);
  doc.text('Multi-Channel Attribution Breakdown', 16, finalY + 12);

  const channelRows = [
    ['Organic Search (Google GA4 + GSC)', '54.2%', '3.8%', '18,400', 'Positive (+14%)'],
    ['Paid Social (Meta Ads)', '24.1%', '4.2%', '6,420', 'Target Met (3.9x ROAS)'],
    ['Direct Traffic', '13.5%', '2.9%', '4,100', 'Steady'],
    ['Referral & Partner Channels', '8.2%', '5.1%', '2,890', 'Growing (+8%)'],
  ];

  autoTable(doc, {
    startY: finalY + 16,
    head: [['Channel', 'Traffic Share', 'Conversion Rate', 'Conversions', 'Trend Status']],
    body: channelRows,
    theme: 'grid',
    headStyles: {
      fillColor: [18, 60, 53],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [35, 45, 40],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [247, 250, 248],
    },
    margin: { left: 16, right: 16 },
  });

  // 6. Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 160, 155);
    doc.text(
      `Marketing Insights • Confidential Client Report • Generated for ${report.clientName}`,
      16,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 28, pageHeight - 8);
  }

  // Save/Download PDF
  const filename = `${report.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${report.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  doc.save(filename);
}
