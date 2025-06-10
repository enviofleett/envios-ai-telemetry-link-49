
interface GP51StatusState {
  isConnected: boolean;
  lastSuccessfulSave?: Date;
  lastMonitorCheck?: Date;
  currentOperation?: 'saving' | 'monitoring' | 'idle';
  errorMessage?: string;
  errorSource?: 'save' | 'monitor';
  username?: string;
}

type StatusUpdateCallback = (status: GP51StatusState) => void;

class GP51StatusCoordinator {
  private static instance: GP51StatusCoordinator;
  private currentStatus: GP51StatusState = {
    isConnected: false,
    currentOperation: 'idle'
  };
  private callbacks: Set<StatusUpdateCallback> = new Set();
  private readonly SAVE_PRIORITY_DURATION = 10000; // 10 seconds after save, ignore monitor errors

  static getInstance(): GP51StatusCoordinator {
    if (!GP51StatusCoordinator.instance) {
      GP51StatusCoordinator.instance = new GP51StatusCoordinator();
    }
    return GP51StatusCoordinator.instance;
  }

  // Called when starting a save operation
  startSaveOperation(): void {
    console.log('🚀 GP51 Status: Starting save operation');
    this.updateStatus({
      currentOperation: 'saving',
      errorMessage: undefined,
      errorSource: undefined
    });
  }

  // Called when save operation succeeds
  reportSaveSuccess(username?: string): void {
    console.log('✅ GP51 Status: Save operation successful');
    this.updateStatus({
      isConnected: true,
      currentOperation: 'idle',
      lastSuccessfulSave: new Date(),
      errorMessage: undefined,
      errorSource: undefined,
      username
    });
  }

  // Called when save operation fails
  reportSaveError(errorMessage: string): void {
    console.log('❌ GP51 Status: Save operation failed');
    this.updateStatus({
      isConnected: false,
      currentOperation: 'idle',
      errorMessage,
      errorSource: 'save'
    });
  }

  // Called when monitor checks connection
  reportMonitorStatus(isConnected: boolean, errorMessage?: string): void {
    const now = new Date();
    
    // If we recently saved successfully, ignore monitor errors for a while
    if (this.currentStatus.lastSuccessfulSave) {
      const timeSinceSave = now.getTime() - this.currentStatus.lastSuccessfulSave.getTime();
      if (timeSinceSave < this.SAVE_PRIORITY_DURATION && !isConnected) {
        console.log('⏸️ GP51 Status: Ignoring monitor error - recent save success takes priority');
        return;
      }
    }

    // Don't override save operations in progress
    if (this.currentStatus.currentOperation === 'saving') {
      console.log('⏸️ GP51 Status: Ignoring monitor update - save in progress');
      return;
    }

    console.log(`📊 GP51 Status: Monitor reports ${isConnected ? 'connected' : 'disconnected'}`);
    
    this.updateStatus({
      isConnected,
      currentOperation: 'idle',
      lastMonitorCheck: now,
      errorMessage: isConnected ? undefined : errorMessage,
      errorSource: isConnected ? undefined : 'monitor'
    });
  }

  // Check if we should show an error to the user
  shouldShowError(): boolean {
    const status = this.currentStatus;
    
    // Don't show errors during save operations
    if (status.currentOperation === 'saving') {
      return false;
    }
    
    // Don't show monitor errors if we recently saved successfully
    if (status.errorSource === 'monitor' && status.lastSuccessfulSave) {
      const timeSinceSave = new Date().getTime() - status.lastSuccessfulSave.getTime();
      if (timeSinceSave < this.SAVE_PRIORITY_DURATION) {
        return false;
      }
    }
    
    return !!status.errorMessage;
  }

  getCurrentStatus(): GP51StatusState {
    return { ...this.currentStatus };
  }

  subscribeToStatus(callback: StatusUpdateCallback): () => void {
    this.callbacks.add(callback);
    
    // Send current status immediately
    callback(this.getCurrentStatus());
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Reset all status (useful for debugging or forced refresh)
  resetStatus(): void {
    console.log('🔄 GP51 Status: Resetting all status');
    this.currentStatus = {
      isConnected: false,
      currentOperation: 'idle'
    };
    this.notifyCallbacks();
  }

  private updateStatus(updates: Partial<GP51StatusState>): void {
    this.currentStatus = {
      ...this.currentStatus,
      ...updates
    };
    this.notifyCallbacks();
  }

  private notifyCallbacks(): void {
    const status = this.getCurrentStatus();
    this.callbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('❌ GP51 Status callback error:', error);
      }
    });
  }
}

export const gp51StatusCoordinator = GP51StatusCoordinator.getInstance();
export type { GP51StatusState };
