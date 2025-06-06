
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical' | 'debug';
  phase?: string;
  type: string;
  message: string;
  data?: any;
  importId?: string;
}

export class ImportLogger {
  private logs: LogEntry[] = [];
  private currentPhase: string | null = null;
  private currentImportId: string | null = null;

  startImportLogging(importId: string): void {
    this.currentImportId = importId;
    this.logs = [];
    console.log('Import logging started for:', importId);
  }

  setPhase(phase: string): void {
    this.currentPhase = phase;
  }

  info(type: string, message: string, data?: any): void {
    this.addLog('info', type, message, data);
  }

  warn(type: string, message: string, data?: any): void {
    this.addLog('warn', type, message, data);
  }

  error(type: string, message: string, data?: any): void {
    this.addLog('error', type, message, data);
  }

  critical(type: string, message: string, data?: any): void {
    this.addLog('critical', type, message, data);
  }

  debug(type: string, message: string, data?: any): void {
    this.addLog('debug', type, message, data);
  }

  private addLog(level: LogEntry['level'], type: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      phase: this.currentPhase || undefined,
      type,
      message,
      data,
      importId: this.currentImportId || undefined
    };

    this.logs.push(entry);
    console.log(`[${level.toUpperCase()}] ${type}: ${message}`, data || '');
  }

  getLogs(filter?: { importId?: string; level?: string; phase?: string }): LogEntry[] {
    if (!filter) return [...this.logs];

    return this.logs.filter(log => {
      if (filter.importId && log.importId !== filter.importId) return false;
      if (filter.level && log.level !== filter.level) return false;
      if (filter.phase && log.phase !== filter.phase) return false;
      return true;
    });
  }

  getLogSummary(): any {
    return {
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(log => log.level === 'error' || log.level === 'critical').length,
      warningCount: this.logs.filter(log => log.level === 'warn').length,
      phases: [...new Set(this.logs.map(log => log.phase).filter(Boolean))],
      importId: this.currentImportId
    };
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }
    
    // CSV format
    const headers = ['timestamp', 'level', 'phase', 'type', 'message', 'importId'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.phase || '',
      log.type,
      log.message,
      log.importId || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  stopImportLogging(): void {
    console.log('Import logging stopped. Total logs:', this.logs.length);
    this.currentImportId = null;
    this.currentPhase = null;
  }
}

export const importLogger = new ImportLogger();
