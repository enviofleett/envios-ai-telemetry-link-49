
import { useState, useEffect } from 'react';
import { workshopRealtimeService, WorkshopActivityData } from '@/services/realtime/WorkshopRealtimeService';

export const useWorkshopActivity = (workshopId: string) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!workshopId) return;

    setIsConnected(true);
    
    const unsubscribe = workshopRealtimeService.subscribeToWorkshopActivity(
      workshopId,
      (activity) => {
        setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50 activities
      }
    );

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [workshopId]);

  const logActivity = async (activity: Omit<WorkshopActivityData, 'workshopId'>) => {
    await workshopRealtimeService.logActivity({
      ...activity,
      workshopId
    });
  };

  return {
    activities,
    isConnected,
    logActivity
  };
};

export const useFormTemplates = (workshopId: string) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!workshopId) return;

    setIsConnected(true);
    
    const unsubscribe = workshopRealtimeService.subscribeToFormTemplates(
      workshopId,
      (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            setTemplates(prev => [...prev, payload.new]);
            break;
          case 'UPDATE':
            setTemplates(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
            break;
          case 'DELETE':
            setTemplates(prev => prev.filter(t => t.id !== payload.old.id));
            break;
        }
      }
    );

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [workshopId]);

  return {
    templates,
    isConnected
  };
};
