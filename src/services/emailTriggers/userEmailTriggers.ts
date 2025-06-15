
import { emailTriggerService } from './emailTriggerService';
import { supabase } from '@/integrations/supabase/client';

export class UserEmailTriggers {
  // Trigger welcome email when user registers
  static async onUserRegistration(userId: string, userEmail: string, userName: string): Promise<void> {
    try {
      // Get company name from company settings if available
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('company_name')
        .eq('user_id', userId)
        .single();

      const companyName = companySettings?.company_name || 'FleetIQ';

      await emailTriggerService.sendUserRegistrationWelcome(
        userEmail,
        userName,
        companyName
      );

      console.log(`✅ Welcome email triggered for user: ${userEmail}`);
    } catch (error) {
      console.error('❌ Failed to trigger welcome email:', error);
    }
  }

  // Trigger password reset email
  static async onPasswordResetRequest(userEmail: string, userName: string, resetToken: string): Promise<void> {
    try {
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
      
      await emailTriggerService.sendPasswordReset(
        userEmail,
        userName,
        resetLink
      );

      console.log(`✅ Password reset email triggered for user: ${userEmail}`);
    } catch (error) {
      console.error('❌ Failed to trigger password reset email:', error);
    }
  }

  // Notify admins of new user registration
  static async notifyAdminsOfNewUser(newUserEmail: string, newUserName: string): Promise<void> {
    try {
      // Get all admin users
      const { data: adminUsers } = await supabase
        .from('envio_users')
        .select(`
          email, 
          name,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'admin');

      if (adminUsers && adminUsers.length > 0) {
        const adminEmails = adminUsers.map(user => user.email);
        
        await emailTriggerService.sendBulkTriggeredEmail(adminEmails, {
          trigger_type: 'admin_notification',
          template_variables: {
            notification_type: 'new_user_registration',
            new_user_name: newUserName,
            new_user_email: newUserEmail,
            registration_date: new Date().toLocaleDateString(),
            admin_panel_link: `${window.location.origin}/admin/users`
          },
          fallback_subject: 'New User Registration',
          fallback_message: `New user ${newUserName} (${newUserEmail}) has registered for FleetIQ.`
        });

        console.log(`✅ Admin notification sent to ${adminEmails.length} admins`);
      }
    } catch (error) {
      console.error('❌ Failed to notify admins of new user:', error);
    }
  }

  // Notify user of unusual overnight parking
  static async notifyOfUnusualParking(vehicleDeviceId: string, address: string): Promise<void> {
    try {
      // Find user associated with the vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          device_name,
          envio_users (
            email,
            name
          )
        `)
        .eq('device_id', vehicleDeviceId)
        .single();

      if (vehicleError || !vehicleData || !vehicleData.envio_users) {
        console.error(`❌ Could not find user for vehicle ${vehicleDeviceId}`, vehicleError);
        return;
      }

      const user = vehicleData.envio_users;
      const vehicleName = vehicleData.device_name || vehicleDeviceId;

      await emailTriggerService.sendBulkTriggeredEmail([user.email], {
        trigger_type: 'unusual_parking_alert',
        template_variables: {
          user_name: user.name,
          vehicle_name: vehicleName,
          parking_location: address,
          timestamp: new Date().toLocaleString(),
        },
        fallback_subject: `Unusual Parking Alert for ${vehicleName}`,
        fallback_message: `Hello ${user.name},\n\nYour vehicle ${vehicleName} has been parked at an unusual overnight location: ${address}.\n\nPlease verify this is expected.`
      });

      console.log(`✅ Unusual parking notification triggered for user: ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to trigger unusual parking notification:', error);
    }
  }
}
