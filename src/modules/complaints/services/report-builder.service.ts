import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { MonthlyReportDto } from '../dtos/response/monthly-report.dto';

@Injectable()
export class ReportBuilderService {
  /**
   * Generates PDF report from monthly report data using PDFKit
   */
  async generateMonthlyReportPDF(data: MonthlyReportDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc, data);

      // Executive Summary
      this.addSummarySection(doc, data);

      // Status Breakdown
      this.addStatusSection(doc, data);

      // Category Breakdown
      this.addCategorySection(doc, data);

      // Authority Breakdown
      this.addAuthoritySection(doc, data);

      // Footer
      this.addFooter(doc, data);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, data: MonthlyReportDto): void {
    doc
      .fontSize(24)
      .fillColor('#2c3e50')
      .text('Monthly Complaints Report', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(16)
      .fillColor('#7f8c8d')
      .text(`${data.period.month} ${data.period.year}`, { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .fillColor('#95a5a6')
      .text(`Generated on: ${new Date(data.reportDate).toLocaleString()}`, { align: 'center' })
      .moveDown(1);

    // Horizontal line
    doc
      .strokeColor('#2c3e50')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);
  }

  private addSummarySection(doc: PDFKit.PDFDocument, data: MonthlyReportDto): void {
    doc.fontSize(16).fillColor('#2c3e50').text('Executive Summary').moveDown(0.5);

    // Summary box background
    const boxY = doc.y;
    doc
      .rect(50, boxY, 495, 80)
      .fillAndStroke('#ecf0f1', '#bdc3c7')
      .fillColor('#2c3e50');

    doc.y = boxY + 20;

    doc
      .fontSize(12)
      .text(`Complaints This Month: `, 70, doc.y, { continued: true })
      .fontSize(18)
      .fillColor('#3498db')
      .text(data.summary.totalComplaints.toString());

    doc
      .fontSize(12)
      .fillColor('#2c3e50')
      .text(`Total All Time: `, 300, boxY + 20, { continued: true })
      .fontSize(18)
      .fillColor('#3498db')
      .text(data.summary.totalAllTime.toString());

    doc.y = boxY + 90;
    doc.moveDown(1);
  }

  private addStatusSection(doc: PDFKit.PDFDocument, data: MonthlyReportDto): void {
    this.addTableSection(doc, 'Status Breakdown', data.statusBreakdown);
  }

  private addCategorySection(doc: PDFKit.PDFDocument, data: MonthlyReportDto): void {
    this.addTableSection(doc, 'Category Breakdown', data.categoryBreakdown);
  }

  private addAuthoritySection(doc: PDFKit.PDFDocument, data: MonthlyReportDto): void {
    this.addTableSection(doc, 'Authority Breakdown', data.authorityBreakdown);
  }

  private addTableSection(
    doc: PDFKit.PDFDocument,
    title: string,
    breakdown: Record<string, number>,
  ): void {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(14).fillColor('#2c3e50').text(title).moveDown(0.5);

    const tableTop = doc.y;
    const itemHeight = 25;
    const col1X = 50;
    const col2X = 400;

    // Table header
    doc
      .rect(col1X, tableTop, 495, itemHeight)
      .fillAndStroke('#3498db', '#2980b9')
      .fillColor('#ffffff')
      .fontSize(11)
      .text('Name', col1X + 10, tableTop + 8, { width: 340 })
      .text('Count', col2X + 10, tableTop + 8, { width: 135, align: 'right' });

    let currentY = tableTop + itemHeight;
    let rowIndex = 0;

    Object.entries(breakdown).forEach(([key, count]) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      // Alternating row colors
      const fillColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
      doc.rect(col1X, currentY, 495, itemHeight).fillAndStroke(fillColor, '#ddd');

      doc
        .fillColor('#2c3e50')
        .fontSize(10)
        .text(this.formatLabel(key), col1X + 10, currentY + 8, { width: 340 })
        .text(count.toString(), col2X + 10, currentY + 8, { width: 135, align: 'right' });

      currentY += itemHeight;
      rowIndex++;
    });

    doc.y = currentY;
    doc.moveDown(1);
  }

  private addFooter(doc: PDFKit.PDFDocument, data: MonthlyReportDto): void {
    const range = doc.bufferedPageRange();
    const pageCount = range.count;

    // PDFKit uses 1-based page indexing
    for (let i = 0; i < pageCount; i++) {
      const pageNumber = range.start + i;
      doc.switchToPage(pageNumber);

      // Footer line
      doc
        .strokeColor('#ddd')
        .lineWidth(1)
        .moveTo(50, 770)
        .lineTo(545, 770)
        .stroke();

      doc
        .fontSize(9)
        .fillColor('#7f8c8d')
        .text(
          'This report was automatically generated by the Shakwa Complaints Management System',
          50,
          780,
          { align: 'center', width: 495 },
        );

      doc
        .fontSize(8)
        .text(
          `Period: ${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`,
          50,
          795,
          { align: 'center', width: 495 },
        );

      // Page number
      doc.text(`Page ${i + 1} of ${pageCount}`, 50, 810, { align: 'center', width: 495 });
    }
  }

  private formatLabel(label: string): string {
    // Convert snake_case to Title Case
    return label
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generates HTML report from monthly report data (for browser viewing)
   */
  generateMonthlyReportHTML(data: MonthlyReportDto): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${this.getReportStyles()}
        </style>
      </head>
      <body>
        ${this.generateHeader(data)}
        ${this.generateSummarySection(data)}
        ${this.generateStatusSection(data)}
        ${this.generateCategorySection(data)}
        ${this.generateAuthoritySection(data)}
        ${this.generateFooter(data)}
      </body>
      </html>
    `;
  }

  private getReportStyles(): string {
    return `
      body {
        font-family: Arial, sans-serif;
        margin: 40px;
        color: #333;
      }
      .header {
        text-align: center;
        margin-bottom: 40px;
        border-bottom: 3px solid #2c3e50;
        padding-bottom: 20px;
      }
      .header h1 {
        color: #2c3e50;
        margin: 0;
      }
      .header p {
        color: #7f8c8d;
        margin: 5px 0;
      }
      .section {
        margin-bottom: 30px;
      }
      .section h2 {
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
      }
      .summary-box {
        background: #ecf0f1;
        padding: 20px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .summary-item {
        display: inline-block;
        margin-right: 40px;
      }
      .summary-item strong {
        color: #2c3e50;
      }
      .summary-item span {
        font-size: 24px;
        color: #3498db;
        font-weight: bold;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      th {
        background-color: #3498db;
        color: white;
        padding: 12px;
        text-align: left;
        border: 1px solid #2980b9;
      }
      td {
        padding: 8px;
        border: 1px solid #ddd;
      }
      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .footer {
        margin-top: 50px;
        text-align: center;
        color: #7f8c8d;
        font-size: 12px;
        border-top: 1px solid #ddd;
        padding-top: 20px;
      }
    `;
  }

  private generateHeader(data: MonthlyReportDto): string {
    return `
      <div class="header">
        <h1>Monthly Complaints Report</h1>
        <p><strong>${data.period.month} ${data.period.year}</strong></p>
        <p>Generated on: ${new Date(data.reportDate).toLocaleString()}</p>
      </div>
    `;
  }

  private generateSummarySection(data: MonthlyReportDto): string {
    return `
      <div class="section">
        <h2>Executive Summary</h2>
        <div class="summary-box">
          <div class="summary-item">
            <strong>Complaints This Month:</strong><br>
            <span>${data.summary.totalComplaints}</span>
          </div>
          <div class="summary-item">
            <strong>Total All Time:</strong><br>
            <span>${data.summary.totalAllTime}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateStatusSection(data: MonthlyReportDto): string {
    const rows = this.generateTableRows(data.statusBreakdown);
    return `
      <div class="section">
        <h2>Status Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th style="text-align: right;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateCategorySection(data: MonthlyReportDto): string {
    const rows = this.generateTableRows(data.categoryBreakdown);
    return `
      <div class="section">
        <h2>Category Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateAuthoritySection(data: MonthlyReportDto): string {
    const rows = this.generateTableRows(data.authorityBreakdown);
    return `
      <div class="section">
        <h2>Authority Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Authority</th>
              <th style="text-align: right;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateFooter(data: MonthlyReportDto): string {
    return `
      <div class="footer">
        <p>This report was automatically generated by the Shakwa Complaints Management System</p>
        <p>Period: ${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}</p>
      </div>
    `;
  }

  private generateTableRows(breakdown: Record<string, number>): string {
    return Object.entries(breakdown)
      .map(
        ([key, count]) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatLabel(key)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${count}</td>
        </tr>
      `,
      )
      .join('');
  }
}
