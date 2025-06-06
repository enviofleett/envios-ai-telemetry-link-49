
export class ImportTimeoutManager {
  private timeoutId: number | null = null;
  private onTimeoutCallback: ((reason: string) => void) | null = null;
  private onCancelCallback: ((reason: string) => void) | null = null;

  startImportTimeout(importId: string, timeoutMinutes: number = 30): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    console.log(`Starting import timeout for ${timeoutMinutes} minutes`);
    
    this.timeoutId = window.setTimeout(() => {
      const reason = `Import timeout after ${timeoutMinutes} minutes`;
      console.error(reason);
      this.onTimeoutCallback?.(reason);
    }, timeoutMinutes * 60 * 1000);
  }

  onTimeout(callback: (reason: string) => void): void {
    this.onTimeoutCallback = callback;
  }

  onCancel(callback: (reason: string) => void): void {
    this.onCancelCallback = callback;
  }

  cancel(reason: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    console.log('Import timeout cancelled:', reason);
    this.onCancelCallback?.(reason);
  }

  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.onTimeoutCallback = null;
    this.onCancelCallback = null;
  }
}

export const importTimeoutManager = new ImportTimeoutManager();
