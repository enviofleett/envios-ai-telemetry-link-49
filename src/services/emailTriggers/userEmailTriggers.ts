
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
}
