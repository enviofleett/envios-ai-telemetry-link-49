
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filename?: string;
  includeCharts?: boolean;
  brandingConfig?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

export interface ExportData {
  title: string;
  data: any[];
  charts?: any[];
  metadata?: {
    generatedAt: string;
    filters: any;
    totals?: any;
  };
}

class ExportService {
  async exportReport(reportData: ExportData, options: ExportOptions): Promise<void> {
    const filename = options.filename || `report_${Date.now()}`;
    
    switch (options.format) {
      case 'excel':
        await this.exportToExcel(reportData, filename);
        break;
      case 'pdf':
        await this.exportToPDF(reportData, filename, options);
        break;
      case 'csv':
        await this.exportToCSV(reportData, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportToExcel(reportData: ExportData, filename: string): Promise<void> {
    const workbook = utils.book_new();

    // Main data sheet
    const mainSheet = utils.json_to_sheet(reportData.data);
    utils.book_append_sheet(workbook, mainSheet, 'Report Data');

    // Summary sheet if metadata exists
    if (reportData.metadata) {
      const summaryData = [
        ['Report Title', reportData.title],
        ['Generated At', reportData.metadata.generatedAt],
        ['Total Records', reportData.data.length],
        ...Object.entries(reportData.metadata.totals || {})
      ];
      const summarySheet = utils.aoa_to_sheet(summaryData);
      utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Charts data sheet
    if (reportData.charts?.length) {
      const chartsSheet = utils.json_to_sheet(reportData.charts);
      utils.book_append_sheet(workbook, chartsSheet, 'Charts Data');
    }

    writeFile(workbook, `${filename}.xlsx`);
  }

  private async exportToPDF(reportData: ExportData, filename: string, options: ExportOptions): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Header with branding
    if (options.brandingConfig?.companyName) {
      doc.setFontSize(20);
      doc.setTextColor(options.brandingConfig.primaryColor || '#000000');
      doc.text(options.brandingConfig.companyName, 20, yPosition);
      yPosition += 15;
    }

    // Report title
    doc.setFontSize(16);
    doc.setTextColor('#000000');
    doc.text(reportData.title, 20, yPosition);
    yPosition += 10;

    // Metadata
    if (reportData.metadata) {
      doc.setFontSize(10);
      doc.text(`Generated: ${reportData.metadata.generatedAt}`, 20, yPosition);
      yPosition += 10;
    }

    // Data table
    if (reportData.data.length > 0) {
      const headers = Object.keys(reportData.data[0]);
      const rows = reportData.data.map(item => headers.map(header => item[header] || ''));

      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: 'striped',
        headStyles: {
          fillColor: options.brandingConfig?.primaryColor ? 
            this.hexToRgb(options.brandingConfig.primaryColor) : [59, 130, 246]
        }
      });
    }

    doc.save(`${filename}.pdf`);
  }

  private async exportToCSV(reportData: ExportData, filename: string): Promise<void> {
    if (reportData.data.length === 0) return;

    const headers = Object.keys(reportData.data[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [59, 130, 246];
  }

  async exportFleetReport(reportData: any, format: 'pdf' | 'excel' | 'csv'): Promise<void> {
    const exportData: ExportData = {
      title: 'Fleet Performance Report',
      data: [
        {
          'Total Vehicles': reportData.metrics.totalVehicles,
          'Active Vehicles': reportData.metrics.activeVehicles,
          'Total Mileage': reportData.metrics.totalMileage,
          'Average Speed': reportData.metrics.averageSpeed,
          'Fuel Efficiency': reportData.metrics.fuelEfficiency,
          'Utilization Rate': `${(reportData.metrics.utilizationRate * 100).toFixed(1)}%`
        }
      ],
      metadata: {
        generatedAt: new Date().toLocaleString(),
        filters: {},
        totals: reportData.metrics
      }
    };

    await this.exportReport(exportData, { format });
  }
}

export const exportService = new ExportService();
