
import { supabase } from '@/integrations/supabase/client';
import { importLogger } from './importLogger';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  emailNotifications: boolean;
  browserNotifications: boolean;
  importCompletion: boolean;
  importFailure: boolean;
  importProgress: boolean;
}

export interface ImportNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

class NotificationService {
  private userId: string | null = null;
  private preferences: NotificationPreferences | null = null;

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadPreferences();
    await this.requestBrowserNotificationPermission();
  }

  private async loadPreferences(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (data) {
        this.preferences = {
          emailNotifications: data.email_notifications,
          browserNotifications: data.browser_notifications,
          importCompletion: data.import_completion,
          importFailure: data.import_failure,
          importProgress: data.import_progress
        };
      } else {
        // Create default preferences
        this.preferences = {
          emailNotifications: true,
          browserNotifications: true,
          importCompletion: true,
          importFailure: true,
          importProgress: false
        };
        await this.savePreferences();
      }
    } catch (error) {
      importLogger.error('notification', 'Failed to load preferences', { error });
      // Use default preferences
      this.preferences = {
        emailNotifications: true,
        browserNotifications: true,
        importCompletion: true,
        importFailure: true,
        importProgress: false
      };
    }
  }

  public async savePreferences(): Promise<void> {
    if (!this.userId || !this.preferences) return;

    try {
      await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: this.userId,
          email_notifications: this.preferences.emailNotifications,
          browser_notifications: this.preferences.browserNotifications,
          import_completion: this.preferences.importCompletion,
          import_failure: this.preferences.importFailure,
          import_progress: this.preferences.importProgress
        });
    } catch (error) {
      importLogger.error('notification', 'Failed to save preferences', { error });
    }
  }

  private async requestBrowserNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  public async notifyImportStarted(importId: string, importType: string): Promise<void> {
    await this.sendNotification({
      type: 'info',
      title: 'Import Started',
      message: `${importType} import has begun`,
      data: { importId, importType },
      persistent: false
    });
  }

  public async notifyImportProgress(importId: string, progress: number, phase: string): Promise<void> {
    if (!this.preferences?.importProgress) return;

    await this.sendNotification({
      type: 'progress',
      title: 'Import Progress',
      message: `${phase}: ${progress}% complete`,
      data: { importId, progress, phase },
      persistent: false
    });
  }

  public async notifyImportCompleted(importId: string, summary: {
    totalUsers: number;
    totalVehicles: number;
    duration: string;
  }): Promise<void> {
    if (!this.preferences?.importCompletion) return;

    await this.sendNotification({
      type: 'success',
      title: 'Import Completed Successfully',
      message: `Imported ${summary.totalUsers} users and ${summary.totalVehicles} vehicles in ${summary.duration}`,
      data: { importId, summary },
      persistent: true,
      email: this.preferences.emailNotifications
    });
  }

  public async notifyImportFailed(importId: string, error: string): Promise<void> {
    if (!this.preferences?.importFailure) return;

    await this.sendNotification({
      type: 'error',
      title: 'Import Failed',
      message: `Import failed: ${error}`,
      data: { importId, error },
      persistent: true,
      email: this.preferences.emailNotifications
    });
  }

  public async notifyConflictsDetected(importId: string, conflictCount: number): Promise<void> {
    await this.sendNotification({
      type: 'warning',
      title: 'Data Conflicts Detected',
      message: `${conflictCount} conflicts found that require resolution`,
      data: { importId, conflictCount },
      persistent: true
    });
  }

  private async sendNotification(options: {
    type: 'success' | 'error' | 'warning' | 'info' | 'progress';
    title: string;
    message: string;
    data?: Record<string, any>;
    persistent?: boolean;
    email?: boolean;
  }): Promise<void> {
    try {
      // Store notification in database
      await supabase
        .from('import_notifications')
        .insert({
          user_id: this.userId,
          notification_type: options.type,
          title: options.title,
          message: options.message,
          data: options.data || {}
        });

      // Show browser toast notification
      this.showToastNotification(options);

      // Show browser notification if enabled and permission granted
      if (this.preferences?.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
        this.showBrowserNotification(options);
      }

      // Send email notification if requested
      if (options.email && this.preferences?.emailNotifications) {
        await this.sendEmailNotification(options);
      }

    } catch (error) {
      importLogger.error('notification', 'Failed to send notification', { error, options });
    }
  }

  private showToastNotification(options: {
    type: 'success' | 'error' | 'warning' | 'info' | 'progress';
    title: string;
    message: string;
  }): void {
    // This would integrate with the toast system
    const { toast } = useToast();
    
    toast({
      title: options.title,
      description: options.message,
      variant: options.type === 'error' ? 'destructive' : 'default'
    });
  }

  private showBrowserNotification(options: {
    title: string;
    message: string;
  }): void {
    new Notification(options.title, {
      body: options.message,
      icon: '/favicon.ico',
      tag: 'import-notification'
    });
  }

  private async sendEmailNotification(options: {
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          userId: this.userId,
          subject: options.title,
          message: options.message,
          data: options.data
        }
      });
    } catch (error) {
      importLogger.error('notification', 'Failed to send email notification', { error });
    }
  }

  public async getNotifications(limit: number = 50): Promise<ImportNotification[]> {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('import_notifications')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(notification => ({
        id: notification.id,
        type: notification.notification_type as any,
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, any>,
        isRead: notification.is_read,
        createdAt: new Date(notification.created_at)
      }));
    } catch (error) {
      importLogger.error('notification', 'Failed to fetch notifications', { error });
      return [];
    }
  }

  public async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('import_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', this.userId);
    } catch (error) {
      importLogger.error('notification', 'Failed to mark notification as read', { error });
    }
  }

  public async markAllAsRead(): Promise<void> {
    if (!this.userId) return;

    try {
      await supabase
        .from('import_notifications')
        .update({ is_read: true })
        .eq('user_id', this.userId)
        .eq('is_read', false);
    } catch (error) {
      importLogger.error('notification', 'Failed to mark all notifications as read', { error });
    }
  }

  public getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  public async updatePreferences(newPreferences: NotificationPreferences): Promise<void> {
    this.preferences = newPreferences;
    await this.savePreferences();
  }
}

export const notificationService = new NotificationService();
