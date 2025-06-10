
// Sync mutex to prevent concurrent operations
class SyncMutex {
  private locks: Map<string, boolean> = new Map();
  private lockTimestamps: Map<string, number> = new Map();
  private readonly LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout

  async acquireLock(lockKey: string): Promise<boolean> {
    const now = Date.now();
    
    // Check if lock exists and is not expired
    if (this.locks.get(lockKey)) {
      const lockTime = this.lockTimestamps.get(lockKey) || 0;
      if (now - lockTime < this.LOCK_TIMEOUT) {
        console.log(`Lock ${lockKey} is already acquired and not expired`);
        return false;
      } else {
        console.log(`Lock ${lockKey} expired, releasing...`);
        this.releaseLock(lockKey);
      }
    }
    
    this.locks.set(lockKey, true);
    this.lockTimestamps.set(lockKey, now);
    console.log(`Lock ${lockKey} acquired at ${new Date(now).toISOString()}`);
    return true;
  }

  releaseLock(lockKey: string): void {
    this.locks.delete(lockKey);
    this.lockTimestamps.delete(lockKey);
    console.log(`Lock ${lockKey} released`);
  }

  isLocked(lockKey: string): boolean {
    const now = Date.now();
    const lockTime = this.lockTimestamps.get(lockKey) || 0;
    
    if (this.locks.get(lockKey) && (now - lockTime < this.LOCK_TIMEOUT)) {
      return true;
    }
    
    // Auto-release expired locks
    if (this.locks.get(lockKey)) {
      this.releaseLock(lockKey);
    }
    
    return false;
  }

  // Force release all locks (for cleanup)
  releaseAllLocks(): void {
    this.locks.clear();
    this.lockTimestamps.clear();
    console.log('All locks released');
  }

  // Get lock status for debugging
  getLockStatus(): Array<{ key: string; acquired: number; age: number }> {
    const now = Date.now();
    return Array.from(this.lockTimestamps.entries()).map(([key, timestamp]) => ({
      key,
      acquired: timestamp,
      age: now - timestamp
    }));
  }
}

export const syncMutex = new SyncMutex();

// Helper function to wrap methods with sync lock
export async function withSyncLock<T>(
  lockKey: string,
  operation: () => Promise<T>
): Promise<T | { success: false; error: string; skipped: true }> {
  const acquired = await syncMutex.acquireLock(lockKey);
  
  if (!acquired) {
    console.log(`Sync operation skipped - lock ${lockKey} already acquired`);
    return { success: false, error: 'Sync already in progress', skipped: true };
  }

  try {
    const result = await operation();
    return result;
  } finally {
    syncMutex.releaseLock(lockKey);
  }
}
