
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
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'workshop_activity_logs',
            filter: `workshop_id=eq.${workshopId}`
          },
          (payload) => {
            const subscribers = this.subscribers.get(channelName);
            if (subscribers) {
              subscribers.forEach(callback => callback(payload.new));
            }
          }
        )
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
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inspection_form_templates',
            filter: `workshop_id=eq.${workshopId}`
          },
          (payload) => {
            const subscribers = this.subscribers.get(channelName);
            if (subscribers) {
              subscribers.forEach(callback => callback(payload));
            }
          }
        )
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
      // Direct insert without using the function that doesn't exist in types
      const { error } = await supabase
        .from('workshop_activity_logs')
        .insert({
          workshop_id: activity.workshopId,
          user_id: activity.userId,
          activity_type: activity.activityType,
          entity_type: activity.entityType,
          entity_id: activity.entityId,
          activity_data: activity.activityData
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
