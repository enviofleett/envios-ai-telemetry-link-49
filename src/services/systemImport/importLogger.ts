
interface ImportLogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  data?: any;
  importId?: string;
  phase?: string;
  userId?: string;
}

interface LogFilter {
  level?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category?: string;
  startTime?: Date;
  endTime?: Date;
  importId?: string;
  phase?: string;
}

export class ImportLogger {
  private logs: ImportLogEntry[] = [];
  private maxLogs = 2000; // Increased for import operations
  private isEnabled = true;
  private currentImportId: string | null = null;
  private currentPhase: string | null = null;
  private alertCallbacks: Array<(entry: ImportLogEntry) => void> = [];

  public startImportLogging(importId: string): void {
    this.currentImportId = importId;
    this.currentPhase = 'initialization';
    this.info('import', `Started logging for import ${importId}`, { importId });
  }

  public setPhase(phase: string): void {
    this.currentPhase = phase;
    this.info('import', `Entering phase: ${phase}`, { phase, importId: this.currentImportId });
  }

  public stopImportLogging(): void {
    if (this.currentImportId) {
      this.info('import', `Stopped logging for import ${this.currentImportId}`, { importId: this.currentImportId });
    }
    this.currentImportId = null;
    this.currentPhase = null;
  }

  public log(
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical',
    category: string,
    message: string,
    data?: any,
    userId?: string
  ): ImportLogEntry {
    if (!this.isEnabled) return null;

    const entry: ImportLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      importId: this.currentImportId,
      phase: this.currentPhase,
      userId
    };

    this.logs.push(entry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to browser console with enhanced formatting
    this.logToBrowserConsole(entry);

    // Store critical errors in database
    if (level === 'error' || level === 'critical') {
      this.storeCriticalLog(entry);
    }

    // Trigger alerts for critical issues
    if (level === 'critical') {
      this.triggerAlert(entry);
    }

    return entry;
  }

  private logToBrowserConsole(entry: ImportLogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const importInfo = entry.importId ? ` [Import: ${entry.importId}]` : '';
    const phaseInfo = entry.phase ? ` [Phase: ${entry.phase}]` : '';
    
    const fullPrefix = `${prefix}${importInfo}${phaseInfo}`;
    
    const consoleMethod = entry.level === 'debug' ? console.debug :
                         entry.level === 'info' ? console.log :
                         entry.level === 'warn' ? console.warn : 
                         console.error;

    if (entry.data) {
      consoleMethod(`${fullPrefix} ${entry.message}`, entry.data);
    } else {
      consoleMethod(`${fullPrefix} ${entry.message}`);
    }
  }

  private async storeCriticalLog(entry: ImportLogEntry): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase
        .from('gp51_import_audit_log')
        .insert({
          system_import_id: entry.importId,
          operation_type: `log_${entry.level}`,
          operation_details: {
            category: entry.category,
            message: entry.message,
            data: entry.data,
            phase: entry.phase,
            timestamp: entry.timestamp.toISOString()
          },
          success: entry.level !== 'error' && entry.level !== 'critical'
        });
    } catch (error) {
      console.error('Failed to store critical log:', error);
    }
  }

  private triggerAlert(entry: ImportLogEntry): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('Error in log alert callback:', error);
      }
    });
  }

  public debug(category: string, message: string, data?: any): ImportLogEntry {
    return this.log('debug', category, message, data);
  }

  public info(category: string, message: string, data?: any): ImportLogEntry {
    return this.log('info', category, message, data);
  }

  public warn(category: string, message: string, data?: any): ImportLogEntry {
    return this.log('warn', category, message, data);
  }

  public error(category: string, message: string, data?: any): ImportLogEntry {
    return this.log('error', category, message, data);
  }

  public critical(category: string, message: string, data?: any): ImportLogEntry {
    return this.log('critical', category, message, data);
  }

  public getLogs(filter?: LogFilter): ImportLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      
      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => log.category.includes(filter.category!));
      }
      
      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
      }
      
      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
      }
      
      if (filter.importId) {
        filteredLogs = filteredLogs.filter(log => log.importId === filter.importId);
      }

      if (filter.phase) {
        filteredLogs = filteredLogs.filter(log => log.phase === filter.phase);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getLogSummary(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    byPhase: Record<string, number>;
    recentErrors: ImportLogEntry[];
  } {
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPhase = this.logs.reduce((acc, log) => {
      if (log.phase) {
        acc[log.phase] = (acc[log.phase] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.logs
      .filter(log => log.level === 'error' || log.level === 'critical')
      .slice(-10)
      .reverse();

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
      byPhase,
      recentErrors
    };
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'importId', 'phase', 'userId'];
      const csvContent = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.importId || '',
          log.phase || '',
          log.userId || ''
        ].join(','))
      ].join('\n');
      
      return csvContent;
    }

    return JSON.stringify(this.logs, null, 2);
  }

  public clearLogs(): void {
    this.logs = [];
    this.info('logging', 'Import log buffer cleared');
  }

  public onAlert(callback: (entry: ImportLogEntry) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

export const importLogger = new ImportLogger();
