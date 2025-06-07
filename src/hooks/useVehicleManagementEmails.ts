
import { useSMTPIntegration } from '@/services/smtpIntegrationService';
import { useToast } from '@/hooks/use-toast';

export const useVehicleManagementEmails = () => {
  const { sendEmail, isSMTPConfigured } = useSMTPIntegration();
  const { toast } = useToast();

  const sendVehicleAlert = async (
    recipientEmail: string, 
    vehicleName: string, 
    alertType: string, 
    alertDetails: string,
    location?: { lat: number; lng: number }
  ) => {
    if (!(await isSMTPConfigured())) {
      console.warn('SMTP not configured, skipping vehicle alert email');
      return false;
    }

    const locationText = location 
      ? `Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      : 'Location: Not available';

    try {
      await sendEmail({
        recipientEmail,
        subject: `Vehicle Alert: ${alertType} - ${vehicleName}`,
        htmlContent: `
          <h2>Vehicle Alert Notification</h2>
          <p><strong>Vehicle:</strong> ${vehicleName}</p>
          <p><strong>Alert Type:</strong> ${alertType}</p>
          <p><strong>Details:</strong> ${alertDetails}</p>
          <p><strong>${locationText}</strong></p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Please take appropriate action if required.</p>
          <p>Best regards,<br>Envio Fleet Management</p>
        `,
        textContent: `Vehicle Alert: ${alertType} for ${vehicleName}. Details: ${alertDetails}. ${locationText}. Time: ${new Date().toLocaleString()}`
      });

      toast({
        title: "Vehicle Alert Sent",
        description: `Alert notification sent for ${vehicleName}`,
      });
      return true;
    } catch (error) {
      console.error('Failed to send vehicle alert email:', error);
      toast({
        title: "Alert Email Failed",
        description: `Failed to send alert for ${vehicleName}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const sendGeofenceAlert = async (
    recipientEmail: string,
    vehicleName: string,
    geofenceName: string,
    alertType: 'enter' | 'exit',
    location: { lat: number; lng: number }
  ) => {
    const actionText = alertType === 'enter' ? 'entered' : 'exited';
    
    return await sendVehicleAlert(
      recipientEmail,
      vehicleName,
      `Geofence ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Vehicle has ${actionText} geofence: ${geofenceName}`,
      location
    );
  };

  const sendMaintenanceAlert = async (
    recipientEmail: string,
    vehicleName: string,
    maintenanceType: string,
    dueDate: string,
    mileage?: number
  ) => {
    const mileageText = mileage ? ` at ${mileage.toLocaleString()} miles` : '';
    
    return await sendVehicleAlert(
      recipientEmail,
      vehicleName,
      'Maintenance Due',
      `${maintenanceType} maintenance is due on ${dueDate}${mileageText}`
    );
  };

  const sendVehicleStatusAlert = async (
    recipientEmail: string,
    vehicleName: string,
    status: string,
    details: string
  ) => {
    return await sendVehicleAlert(
      recipientEmail,
      vehicleName,
      `Status Change: ${status}`,
      details
    );
  };

  return {
    sendVehicleAlert,
    sendGeofenceAlert,
    sendMaintenanceAlert,
    sendVehicleStatusAlert,
    isSMTPConfigured
  };
};
