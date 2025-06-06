
export interface ImportError {
  code: string;
  message: string;
  context?: any;
  recoverable: boolean;
  timestamp: string;
}

export interface RecoveryAction {
  type: 'retry' | 'rollback' | 'skip' | 'manual';
  description: string;
  handler?: () => Promise<void>;
}

export class ImportErrorHandler {
  private errors: ImportError[] = [];
  private recoveryActions: Map<string, RecoveryAction> = new Map();

  constructor() {
    this.setupRecoveryActions();
  }

  private setupRecoveryActions() {
    this.recoveryActions.set('GP51_CONNECTION_FAILED', {
      type: 'retry',
      description: 'Retry GP51 connection with fresh authentication'
    });

    this.recoveryActions.set('TRANSACTION_FAILED', {
      type: 'rollback',
      description: 'Rollback transaction and restore previous state'
    });

    this.recoveryActions.set('VALIDATION_FAILED', {
      type: 'skip',
      description: 'Skip invalid records and continue with valid ones'
    });

    this.recoveryActions.set('TIMEOUT_ERROR', {
      type: 'retry',
      description: 'Retry operation with extended timeout'
    });
  }

  logError(code: string, message: string, context?: any, recoverable: boolean = true): ImportError {
    const error: ImportError = {
      code,
      message,
      context,
      recoverable,
      timestamp: new Date().toISOString()
    };

    this.errors.push(error);
    console.error(`Import Error [${code}]:`, message, context);
    
    return error;
  }

  getRecoveryAction(errorCode: string): RecoveryAction | null {
    return this.recoveryActions.get(errorCode) || null;
  }

  getErrors(): ImportError[] {
    return [...this.errors];
  }

  getRecoverableErrors(): ImportError[] {
    return this.errors.filter(error => error.recoverable);
  }

  clearErrors(): void {
    this.errors = [];
  }

  hasCriticalErrors(): boolean {
    return this.errors.some(error => !error.recoverable);
  }

  formatErrorsForUser(): string {
    if (this.errors.length === 0) return 'No errors occurred';
    
    const criticalErrors = this.errors.filter(error => !error.recoverable);
    const recoverableErrors = this.errors.filter(error => error.recoverable);
    
    let message = '';
    
    if (criticalErrors.length > 0) {
      message += `Critical Errors (${criticalErrors.length}):\n`;
      criticalErrors.forEach(error => {
        message += `• ${error.message}\n`;
      });
    }
    
    if (recoverableErrors.length > 0) {
      message += `\nRecoverable Issues (${recoverableErrors.length}):\n`;
      recoverableErrors.forEach(error => {
        const recovery = this.getRecoveryAction(error.code);
        message += `• ${error.message}${recovery ? ` (${recovery.description})` : ''}\n`;
      });
    }
    
    return message;
  }
}

export const importErrorHandler = new ImportErrorHandler();
