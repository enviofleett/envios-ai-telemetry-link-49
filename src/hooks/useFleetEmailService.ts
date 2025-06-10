
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';

interface FleetAlertParams {
  vehicleId: string;
  alertType: string;
  message: string;
  recipientEmails: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface EmailPreferences {
  userId: string;
  vehicleAlerts: boolean;
  maintenanceReminders: boolean;
  geofenceAlerts: boolean;
  systemUpdates: boolean;
  urgentOnly: boolean;
  email: string;
}

export const useFleetEmailService = () => {
  const { toast } = useToast();

  // Send fleet alert
  const sendFleetAlert = useMutation({
    mutationFn: async (params: FleetAlertParams) => {
      console.log('🚨 Sending fleet alert:', params);
      
      const { data, error } = await supabase.functions.invoke('smtp-email-service', {
        body: {
          action: 'send-fleet-alert',
          ...params
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send fleet alert');
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Fleet alert sent successfully:', data);
      toast({
        title: "Fleet Alert Sent",
        description: `Alert "${variables.alertType}" sent to ${variables.recipientEmails.length} recipient(s)`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Fleet alert failed:', error);
      toast({
        title: "Alert Failed",
        description: error.message || "Failed to send fleet alert",
        variant: "destructive"
      });
    }
  });

  // Get email preferences for users
  const { data: emailPreferences, refetch: refetchPreferences } = useQuery({
    queryKey: ['email-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*');
      
      if (error) throw error;
      return data as EmailPreferences[];
    }
  });

  // Send vehicle event notifications
  const sendVehicleEventNotification = async (
    vehicleId: string,
    eventType: string,
    eventData: Record<string, any>
  ) => {
    try {
      // Get users who should receive this notification
      const eligibleUsers = await getEligibleUsersForEvent(eventType);
      
      if (eligibleUsers.length === 0) {
        console.log('No eligible users for event:', eventType);
        return;
      }

      const recipientEmails = eligibleUsers.map(user => user.email);
      
      await sendFleetAlert.mutateAsync({
        vehicleId,
        alertType: eventType,
        message: generateEventMessage(eventType, eventData),
        recipientEmails,
        priority: getEventPriority(eventType),
        metadata: eventData
      });

    } catch (error) {
      console.error('Failed to send vehicle event notification:', error);
    }
  };

  // Send maintenance reminders
  const sendMaintenanceReminder = async (
    vehicleId: string,
    maintenanceType: string,
    dueDate: string,
    mileage?: number
  ) => {
    const eligibleUsers = await getEligibleUsersForEvent('maintenance');
    if (eligibleUsers.length === 0) return;

    const recipientEmails = eligibleUsers.map(user => user.email);
    const mileageText = mileage ? ` at ${mileage.toLocaleString()} miles` : '';

    await sendFleetAlert.mutateAsync({
      vehicleId,
      alertType: 'Maintenance Due',
      message: `${maintenanceType} maintenance is due on ${dueDate}${mileageText}`,
      recipientEmails,
      priority: 'medium',
      metadata: {
        maintenanceType,
        dueDate,
        mileage,
        type: 'maintenance_reminder'
      }
    });
  };

  // Send geofence alerts
  const sendGeofenceAlert = async (
    vehicleId: string,
    geofenceName: string,
    alertType: 'enter' | 'exit',
    location: { lat: number; lng: number }
  ) => {
    const eligibleUsers = await getEligibleUsersForEvent('geofence');
    if (eligibleUsers.length === 0) return;

    const recipientEmails = eligibleUsers.map(user => user.email);
    const actionText = alertType === 'enter' ? 'entered' : 'exited';

    await sendFleetAlert.mutateAsync({
      vehicleId,
      alertType: `Geofence ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      message: `Vehicle has ${actionText} geofence: ${geofenceName}`,
      recipientEmails,
      priority: 'medium',
      metadata: {
        geofenceName,
        alertType,
        location,
        type: 'geofence_alert'
      }
    });
  };

  // Helper functions
  const getEligibleUsersForEvent = async (eventType: string): Promise<EmailPreferences[]> => {
    if (!emailPreferences) return [];

    return emailPreferences.filter(pref => {
      switch (eventType) {
        case 'vehicle_offline':
        case 'vehicle_online':
        case 'speed_violation':
        case 'panic_button':
          return pref.vehicleAlerts;
        case 'maintenance':
          return pref.maintenanceReminders;
        case 'geofence':
          return pref.geofenceAlerts;
        case 'system_update':
          return pref.systemUpdates;
        default:
          return !pref.urgentOnly; // Send non-urgent events unless urgentOnly is true
      }
    });
  };

  const generateEventMessage = (eventType: string, eventData: Record<string, any>): string => {
    switch (eventType) {
      case 'vehicle_offline':
        return `Vehicle has gone offline. Last seen: ${eventData.lastSeen || 'Unknown'}`;
      case 'vehicle_online':
        return `Vehicle is back online after being offline since ${eventData.offlineSince || 'Unknown'}`;
      case 'speed_violation':
        return `Speed limit violation detected. Current speed: ${eventData.currentSpeed || 'Unknown'} mph in ${eventData.speedLimit || 'Unknown'} mph zone`;
      case 'panic_button':
        return `PANIC BUTTON ACTIVATED - Immediate attention required`;
      case 'low_battery':
        return `Low battery warning - Battery level: ${eventData.batteryLevel || 'Unknown'}%`;
      case 'harsh_driving':
        return `Harsh driving event detected: ${eventData.eventType || 'Unknown'} at ${eventData.speed || 'Unknown'} mph`;
      default:
        return `Fleet event: ${eventType}`;
    }
  };

  const getEventPriority = (eventType: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (eventType) {
      case 'panic_button':
        return 'critical';
      case 'speed_violation':
      case 'vehicle_offline':
        return 'high';
      case 'harsh_driving':
      case 'geofence':
      case 'maintenance':
        return 'medium';
      default:
        return 'low';
    }
  };

  return {
    sendFleetAlert: sendFleetAlert.mutateAsync,
    sendVehicleEventNotification,
    sendMaintenanceReminder,
    sendGeofenceAlert,
    emailPreferences,
    refetchPreferences,
    isLoading: sendFleetAlert.isPending
  };
};
