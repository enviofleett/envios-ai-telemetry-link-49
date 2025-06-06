
export class NotificationService {
  async notifyImportStarted(importId: string, importType: string): Promise<void> {
    console.log(`Import started: ${importId} (${importType})`);
  }

  async notifyImportProgress(importId: string, progress: number, phase: string): Promise<void> {
    // Only log significant progress milestones to avoid spam
    if (progress % 10 === 0) {
      console.log(`Import progress: ${importId} - ${progress}% (${phase})`);
    }
  }

  async notifyImportCompleted(importId: string, results: { totalUsers: number; totalVehicles: number; duration: string }): Promise<void> {
    console.log(`Import completed: ${importId}`, results);
  }

  async notifyImportFailed(importId: string, error: string): Promise<void> {
    console.error(`Import failed: ${importId} - ${error}`);
  }
}

export const notificationService = new NotificationService();
