
import { useState } from 'react';
import { UserEmailTriggers } from '@/services/emailTriggers/userEmailTriggers';
import { VehicleEmailTriggers } from '@/services/emailTriggers/vehicleEmailTriggers';
import { SystemEmailTriggers } from '@/services/emailTriggers/systemEmailTriggers';
import { useToast } from '@/hooks/use-toast';

export const useEmailTriggers = () => {
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast } = useToast();

  const triggerUserWelcome = async (userEmail: string, userName: string, companyName?: string) => {
    setIsTriggering(true);
    try {
      await UserEmailTriggers.onUserRegistration('temp-id', userEmail, userName);
      toast({
        title: "Welcome Email Sent",
        description: `Welcome email sent to ${userEmail}`,
      });
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send welcome email",
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const triggerPasswordReset = async (userEmail: string, userName: string, resetToken: string) => {
    setIsTriggering(true);
    try {
      await UserEmailTriggers.onPasswordResetRequest(userEmail, userName, resetToken);
      toast({
        title: "Password Reset Email Sent",
        description: `Password reset email sent to ${userEmail}`,
      });
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send password reset email",
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const triggerVehicleOffline = async (
    vehicleId: string,
    vehicleName: string,
    deviceId: string,
    lastContact: Date,
    location: string
  ) => {
    setIsTriggering(true);
    try {
      await VehicleEmailTriggers.onVehicleOffline(vehicleId, vehicleName, deviceId, lastContact, location);
      toast({
        title: "Vehicle Alert Sent",
        description: `Offline alert sent for vehicle ${vehicleName}`,
      });
    } catch (error) {
      toast({
        title: "Alert Failed",
        description: "Failed to send vehicle offline alert",
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const triggerMaintenanceReminder = async (
    vehicleId: string,
    vehicleName: string,
    maintenanceType: string,
    dueDate: Date,
    ownerEmail?: string
  ) => {
    setIsTriggering(true);
    try {
      await VehicleEmailTriggers.onMaintenanceDue(vehicleId, vehicleName, maintenanceType, dueDate, ownerEmail);
      toast({
        title: "Maintenance Reminder Sent",
        description: `Maintenance reminder sent for ${vehicleName}`,
      });
    } catch (error) {
      toast({
        title: "Reminder Failed",
        description: "Failed to send maintenance reminder",
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const triggerSystemNotification = async (
    recipients: string[],
    subject: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ) => {
    setIsTriggering(true);
    try {
      for (const recipient of recipients) {
        await SystemEmailTriggers.onSecurityAlert(subject, message, type === 'error' ? 'high' : 'medium', [recipient]);
      }
      toast({
        title: "System Notifications Sent",
        description: `Notifications sent to ${recipients.length} recipients`,
      });
    } catch (error) {
      toast({
        title: "Notification Failed",
        description: "Failed to send system notifications",
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return {
    isTriggering,
    triggerUserWelcome,
    triggerPasswordReset,
    triggerVehicleOffline,
    triggerMaintenanceReminder,
    triggerSystemNotification
  };
};
