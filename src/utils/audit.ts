import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WebsiteAuditReport, SeoFault } from '../types';

export async function fetchWebsiteAudit(url: string): Promise<WebsiteAuditReport> {
  const endpoint = `/api/audit/website?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to audit website (HTTP ${res.status})`);
  }

  return res.json();
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return '#10b981'; // Green
    case 'B':
      return '#3b82f6'; // Blue
    case 'C':
      return '#f59e0b'; // Amber
    case 'D':
      return '#f97316'; // Orange
    case 'F':
    default:
      return '#ef4444'; // Red
  }
}

export function getSeverityBadge(severity: SeoFault['severity']) {
  switch (severity) {
    case 'critical':
      return {
        label: 'Critical Issue',
        bg: 'rgba(239, 68, 68, 0.12)',
        color: '#ef4444',
        border: 'rgba(239, 68, 68, 0.25)',
      };
    case 'warning':
      return {
        label: 'Warning',
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.25)',
      };
    case 'passed':
    default:
      return {
        label: 'Passed',
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        border: 'rgba(16, 185, 129, 0.25)',
      };
  }
}

export function getCategoryLabel(category: SeoFault['category']): string {
  switch (category) {
    case 'meta':
      return 'Meta & Content';
    case 'headings':
      return 'Headings Hierarchy';
    case 'images':
      return 'Image Optimization';
    case 'indexability':
      return 'Crawlability & Indexing';
    case 'security':
      return 'Security & SSL';
    case 'social':
      return 'Social Open Graph';
    case 'links':
      return 'Internal/External Links';
    case 'performance':
      return 'Core Web Vitals';
    default:
      return category;
  }
}

export function generateAuditPdf(report: WebsiteAuditReport, clientName?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a Deep Slate
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Brand Icon Badge
  doc.setFillColor(16, 185, 129); // #10b981 Emerald
  doc.roundedRect(16, 12, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('A', 19.5, 19);

  // Brand Title
  doc.setFontSize(15);
  doc.text('Marketing Insights • Site Audit', 30, 19);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Muted slate
  doc.text('COMPREHENSIVE ON-PAGE SEO & TECHNICAL AUDIT REPORT', 30, 26);

  // Report Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`SEO Health & Fault Audit: ${report.hostname}`, 16, 54);

  // Meta Subheader
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Target: ${report.url}  |  Grade: ${report.grade} (${report.overallScore}/100)  |  Audited: ${new Date(report.auditTime).toLocaleDateString()}`,
    16,
    61
  );

  // Overview Cards
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, 68, pageWidth - 32, 28, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Audit Summary', 22, 76);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `• Overall SEO Score: ${report.overallScore}/100 (Grade ${report.grade})\n` +
    `• Critical Faults: ${report.summary.criticalCount}  |  Warnings: ${report.summary.warningCount}  |  Passed Checks: ${report.summary.passedCount}\n` +
    `• Word Count: ${report.overview.wordCount} words  |  Images: ${report.overview.imageCount} (${report.overview.imagesMissingAlt} missing alt)\n` +
    `• Tracking Stack: ${report.techStack.map((t) => t.name).join(', ') || 'Standard HTML'}`,
    22,
    82
  );

  // Detected Tech Stack Box
  if (report.techStack.length > 0) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(16, 101, pageWidth - 32, 14, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Detected Marketing & Tech Stack:', 20, 107);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const techStr = report.techStack.map((t) => `${t.name}${t.id ? ` (${t.id})` : ''}`).join('  •  ');
    doc.text(techStr, 20, 112);
  }

  // Faults Table
  const tableStartY = report.techStack.length > 0 ? 120 : 104;

  const tableRows = report.faults.map((fault) => [
    fault.severity.toUpperCase(),
    getCategoryLabel(fault.category),
    fault.title,
    fault.recommendation,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 16, right: 16 },
    head: [['Severity', 'Category', 'Audit Issue', 'Actionable Recommendation']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 55 },
      3: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const val = data.cell.raw;
        if (val === 'CRITICAL') {
          data.cell.styles.textColor = [239, 68, 68];
        } else if (val === 'WARNING') {
          data.cell.styles.textColor = [217, 119, 6];
        } else if (val === 'PASSED') {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    },
  });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Marketing Insights Platform  •  Client Confidential  •  Page ${i} of ${totalPages}`,
      16,
      pageHeight - 8
    );
    doc.text(`Generated for: ${clientName || report.hostname}`, pageWidth - 60, pageHeight - 8);
  }

  doc.save(`Site-Audit-${report.hostname}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
