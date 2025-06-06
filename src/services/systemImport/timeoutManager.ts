
interface TimeoutConfig {
  operationTimeout: number; // Individual operation timeout
  totalImportTimeout: number; // Total import timeout
  heartbeatInterval: number; // Heartbeat check interval
  gracefulShutdownTimeout: number; // Time to allow for cleanup
}

interface CancellationToken {
  isCancelled: boolean;
  reason?: string;
  timestamp?: Date;
}

export class ImportTimeoutManager {
  private config: TimeoutConfig;
  private operationTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private totalTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cancellationToken: CancellationToken = { isCancelled: false };
  private onTimeoutCallback?: (reason: string) => void;
  private onCancelCallback?: (reason: string) => void;
  private startTime: Date | null = null;
  private lastHeartbeat: Date | null = null;

  constructor(config?: Partial<TimeoutConfig>) {
    this.config = {
      operationTimeout: 5 * 60 * 1000, // 5 minutes per operation
      totalImportTimeout: 45 * 60 * 1000, // 45 minutes total
      heartbeatInterval: 30 * 1000, // 30 seconds
      gracefulShutdownTimeout: 10 * 1000, // 10 seconds for cleanup
      ...config
    };
  }

  public startImportTimeout(importId: string): void {
    console.log(`Starting timeout management for import ${importId}`, this.config);
    
    this.startTime = new Date();
    this.lastHeartbeat = new Date();
    this.cancellationToken = { isCancelled: false };

    // Set total import timeout
    this.totalTimeout = setTimeout(() => {
      this.handleTimeout('Total import timeout exceeded');
    }, this.config.totalImportTimeout);

    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
    }, this.config.heartbeatInterval);

    console.log(`Import timeout set for ${this.config.totalImportTimeout / 1000 / 60} minutes`);
  }

  public startOperationTimeout(operationId: string): void {
    // Clear any existing timeout for this operation
    this.clearOperationTimeout(operationId);

    // Set new timeout
    const timeout = setTimeout(() => {
      this.handleOperationTimeout(operationId);
    }, this.config.operationTimeout);

    this.operationTimeouts.set(operationId, timeout);
    console.log(`Operation timeout set for ${operationId}: ${this.config.operationTimeout / 1000} seconds`);
  }

  public clearOperationTimeout(operationId: string): void {
    const timeout = this.operationTimeouts.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      this.operationTimeouts.delete(operationId);
      console.log(`Operation timeout cleared for ${operationId}`);
    }
  }

  public updateHeartbeat(): void {
    this.lastHeartbeat = new Date();
  }

  public cancel(reason: string = 'User requested cancellation'): void {
    console.log(`Cancelling import: ${reason}`);
    
    this.cancellationToken = {
      isCancelled: true,
      reason,
      timestamp: new Date()
    };

    this.cleanup();

    if (this.onCancelCallback) {
      this.onCancelCallback(reason);
    }
  }

  public isCancelled(): boolean {
    return this.cancellationToken.isCancelled;
  }

  public getCancellationReason(): string | undefined {
    return this.cancellationToken.reason;
  }

  public throwIfCancelled(): void {
    if (this.cancellationToken.isCancelled) {
      throw new Error(`Operation cancelled: ${this.cancellationToken.reason}`);
    }
  }

  public async withTimeout<T>(
    operation: () => Promise<T>,
    operationId: string,
    customTimeout?: number
  ): Promise<T> {
    this.throwIfCancelled();

    const timeout = customTimeout || this.config.operationTimeout;
    
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation ${operationId} timed out after ${timeout / 1000} seconds`));
      }, timeout);

      // Check for cancellation periodically
      const cancellationCheck = setInterval(() => {
        if (this.cancellationToken.isCancelled) {
          clearTimeout(timer);
          clearInterval(cancellationCheck);
          reject(new Error(`Operation ${operationId} was cancelled: ${this.cancellationToken.reason}`));
        }
      }, 1000);

      operation()
        .then(result => {
          clearTimeout(timer);
          clearInterval(cancellationCheck);
          this.updateHeartbeat();
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          clearInterval(cancellationCheck);
          reject(error);
        });
    });
  }

  public async withGracefulShutdown<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      return await operation();
    } catch (error) {
      const elapsed = Date.now() - startTime;
      
      // If we're near the graceful shutdown timeout, don't retry
      if (elapsed > this.config.gracefulShutdownTimeout * 0.8) {
        console.warn('Operation failed near graceful shutdown timeout, not retrying');
        throw error;
      }
      
      throw error;
    }
  }

  private handleTimeout(reason: string): void {
    console.error(`Import timeout: ${reason}`);
    
    this.cancellationToken = {
      isCancelled: true,
      reason: `Timeout: ${reason}`,
      timestamp: new Date()
    };

    this.cleanup();

    if (this.onTimeoutCallback) {
      this.onTimeoutCallback(reason);
    }
  }

  private handleOperationTimeout(operationId: string): void {
    const reason = `Operation ${operationId} timed out`;
    console.error(reason);
    
    this.operationTimeouts.delete(operationId);
    
    // Don't cancel the entire import for a single operation timeout
    // Instead, let the operation handler decide what to do
    console.warn(`Operation ${operationId} timed out but import continues`);
  }

  private checkHeartbeat(): void {
    if (!this.lastHeartbeat) return;

    const timeSinceHeartbeat = Date.now() - this.lastHeartbeat.getTime();
    const heartbeatThreshold = this.config.heartbeatInterval * 3; // 3 missed heartbeats

    if (timeSinceHeartbeat > heartbeatThreshold) {
      this.handleTimeout(`Heartbeat timeout: ${timeSinceHeartbeat / 1000} seconds since last heartbeat`);
    }
  }

  private cleanup(): void {
    // Clear total timeout
    if (this.totalTimeout) {
      clearTimeout(this.totalTimeout);
      this.totalTimeout = null;
    }

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clear all operation timeouts
    this.operationTimeouts.forEach((timeout, operationId) => {
      clearTimeout(timeout);
      console.log(`Cleared timeout for operation: ${operationId}`);
    });
    this.operationTimeouts.clear();
  }

  public onTimeout(callback: (reason: string) => void): void {
    this.onTimeoutCallback = callback;
  }

  public onCancel(callback: (reason: string) => void): void {
    this.onCancelCallback = callback;
  }

  public getStatus(): {
    isActive: boolean;
    isCancelled: boolean;
    timeElapsed: number;
    timeRemaining: number;
    activeOperations: number;
    lastHeartbeat: Date | null;
  } {
    const now = Date.now();
    const timeElapsed = this.startTime ? now - this.startTime.getTime() : 0;
    const timeRemaining = Math.max(0, this.config.totalImportTimeout - timeElapsed);

    return {
      isActive: this.totalTimeout !== null,
      isCancelled: this.cancellationToken.isCancelled,
      timeElapsed,
      timeRemaining,
      activeOperations: this.operationTimeouts.size,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  public destroy(): void {
    this.cleanup();
    this.onTimeoutCallback = undefined;
    this.onCancelCallback = undefined;
    this.startTime = null;
    this.lastHeartbeat = null;
  }
}

export const importTimeoutManager = new ImportTimeoutManager();
