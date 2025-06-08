
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
}

interface LogFilter {
  level?: 'debug' | 'info' | 'warn' | 'error';
  category?: string;
  startTime?: Date;
  endTime?: Date;
}

export class ProductionLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500; // Reduced from 1000
  private isEnabled = process.env.NODE_ENV === 'development';

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: string,
    message: string,
    data?: any
  ): void {
    if (!this.isEnabled) {
      // In production, only log errors
      if (level !== 'error') return;
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Use native console methods without override
    this.logToConsole(entry);
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    const consoleMethod = entry.level === 'debug' ? console.debug :
                         entry.level === 'info' ? console.log :
                         entry.level === 'warn' ? console.warn : 
                         console.error;

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
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public clearLogs(): void {
    this.logs = [];
    this.info('logging', 'Log buffer cleared');
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

export const logger = new ProductionLogger();
