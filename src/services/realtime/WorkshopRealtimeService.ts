
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WorkshopActivityData {
  workshopId: string;
  activityType: 'inspection_created' | 'inspection_updated' | 'template_modified' | 'user_login' | 'settings_changed' | 'report_generated';
  entityType?: string;
  entityId?: string;
  activityData: any;
  userId?: string;
}

export class WorkshopRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  subscribeToWorkshopActivity(workshopId: string, callback: (activity: any) => void): () => void {
    const channelName = `workshop_activity_${workshopId}`;
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'workshop_activity' }, (payload) => {
          const subscribers = this.subscribers.get(channelName);
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.payload));
          }
        })
        .subscribe();

      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }

    const subscribers = this.subscribers.get(channelName)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.subscribers.delete(channelName);
        }
      }
    };
  }

  subscribeToFormTemplates(workshopId: string, callback: (template: any) => void): () => void {
    const channelName = `form_templates_${workshopId}`;
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'template_change' }, (payload) => {
          const subscribers = this.subscribers.get(channelName);
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.payload));
          }
        })
        .subscribe();

      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }

    const subscribers = this.subscribers.get(channelName)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.subscribers.delete(channelName);
        }
      }
    };
  }

  async logActivity(activity: WorkshopActivityData): Promise<void> {
    try {
      // Use broadcast to send activity to subscribers
      const channel = supabase.channel(`workshop_activity_${activity.workshopId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'workshop_activity',
        payload: {
          ...activity,
          timestamp: new Date().toISOString()
        }
      });

      // Also store in application_errors table as a temporary solution
      const { error } = await supabase
        .from('application_errors')
        .insert({
          error_type: 'workshop_activity',
          error_message: activity.activityType,
          error_context: {
            workshopId: activity.workshopId,
            entityType: activity.entityType,
            entityId: activity.entityId,
            activityData: activity.activityData
          },
          user_id: activity.userId,
          severity: 'low'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log workshop activity:', error);
    }
  }

  disconnect(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscribers.clear();
  }
}

export const workshopRealtimeService = new WorkshopRealtimeService();
