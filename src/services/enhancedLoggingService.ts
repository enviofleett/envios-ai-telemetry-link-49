
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

interface LogFilter {
  level?: 'debug' | 'info' | 'warn' | 'error';
  category?: string;
  startTime?: Date;
  endTime?: Date;
  userId?: string;
}

export class EnhancedLoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor() {
    // Store original console methods before overriding
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    };
    
    // Initialize with console override for better debugging
    this.overrideConsole();
  }

  private overrideConsole(): void {
    console.log = (...args) => {
      this.log('info', 'console', args.join(' '), { originalArgs: args });
      this.originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.log('warn', 'console', args.join(' '), { originalArgs: args });
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.log('error', 'console', args.join(' '), { originalArgs: args });
      this.originalConsole.error(...args);
    };

    console.debug = (...args) => {
      this.log('debug', 'console', args.join(' '), { originalArgs: args });
      this.originalConsole.debug(...args);
    };
  }

  public log(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: string,
    message: string,
    data?: any,
    userId?: string,
    sessionId?: string
  ): void {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      userId,
      sessionId
    };

    this.logs.push(entry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Use original console methods to avoid recursion
    this.logToBrowserConsole(entry);
  }

  private logToBrowserConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    // Use original console methods to prevent infinite recursion
    const consoleMethod = entry.level === 'debug' ? this.originalConsole.debug :
                         entry.level === 'info' ? this.originalConsole.log :
                         entry.level === 'warn' ? this.originalConsole.warn : 
                         this.originalConsole.error;

    if (entry.data) {
      consoleMethod(`${prefix} ${entry.message}`, entry.data);
    } else {
      consoleMethod(`${prefix} ${entry.message}`);
    }
  }

  public debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  public info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  public warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  public error(category: string, message: string, data?: any): void {
    this.log('error', category, message, data);
  }

  public getLogs(filter?: LogFilter): LogEntry[] {
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
      
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getLogSummary(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    recentErrors: LogEntry[];
  } {
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.logs
      .filter(log => log.level === 'error')
      .slice(-10)
      .reverse();

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
      recentErrors
    };
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'sessionId'];
      const csvContent = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userId || '',
          log.sessionId || ''
        ].join(','))
      ].join('\n');
      
      return csvContent;
    }

    return JSON.stringify(this.logs, null, 2);
  }

  public clearLogs(): void {
    this.logs = [];
    this.info('logging', 'Log buffer cleared');
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.info('logging', `Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  public setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
    this.info('logging', `Max logs set to ${max}`);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

export const enhancedLogger = new EnhancedLoggingService();
