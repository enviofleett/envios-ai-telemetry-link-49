import { supabase } from '@/integrations/supabase/client';

export class UserEmailTriggers {
  static async onUserRegistration(userId: string, userEmail: string, userName: string): Promise<void> {
    try {
      console.log(`📧 Sending welcome email to new user ${userName} (${userEmail})`);

      // Queue email notification
      const { error: emailError } = await supabase
        .from('email_notification_queue')
        .insert({
          user_id: userId,
          recipient_email: userEmail,
          subject: 'Welcome to Our Platform',
          body_text: `Dear ${userName},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team`,
          body_html: `<p>Dear ${userName},</p><p>Welcome to our platform! We're excited to have you on board.</p><p>Best regards,<br/>The Team</p>`,
          status: 'pending'
        });

      if (emailError) {
        console.error('Error queuing welcome email:', emailError);
      } else {
        console.log('✅ Welcome email queued successfully');
      }

    } catch (error) {
      console.error('Exception in welcome email trigger:', error);
    }
  }

  static async notifyAdminsOfNewUser(userId: string, userEmail: string, userName: string): Promise<void> {
    try {
      console.log(`📧 Notifying admins of new user ${userName} (${userEmail})`);

      // Get admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('envio_users')
        .select(`
          email,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'admin');

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        return;
      }

      if (!adminUsers || adminUsers.length === 0) {
        console.log('No admin users found to notify');
        return;
      }

      // Send notification to each admin
      for (const admin of adminUsers) {
        const { error: emailError } = await supabase
          .from('email_notification_queue')
          .insert({
            user_id: userId,
            recipient_email: admin.email,
            subject: 'New User Registration',
            body_text: `A new user has registered on the platform:\n\nName: ${userName}\nEmail: ${userEmail}\n\nPlease review their account if necessary.`,
            body_html: `<p>A new user has registered on the platform:</p><ul><li><strong>Name:</strong> ${userName}</li><li><strong>Email:</strong> ${userEmail}</li></ul><p>Please review their account if necessary.</p>`,
            status: 'pending'
          });

        if (emailError) {
          console.error(`Error queuing admin notification for ${admin.email}:`, emailError);
        }
      }

      console.log('✅ Admin notifications queued successfully');

    } catch (error) {
      console.error('Exception in admin notification trigger:', error);
    }
  }

  static async onPasswordResetRequest(userEmail: string, userName: string, resetToken: string): Promise<void> {
    try {
      console.log(`📧 Sending password reset email to ${userEmail}`);

      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;

      // Get user ID for the queue
      const { data: userData, error: userError } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError) {
        console.error('Error fetching user for password reset email:', userError);
        return;
      }

      // Queue email notification
      const { error: emailError } = await supabase
        .from('email_notification_queue')
        .insert({
          user_id: userData.id,
          recipient_email: userEmail,
          subject: 'Password Reset Request',
          body_text: `Dear ${userName},\n\nYou have requested to reset your password. Please click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nThe Team`,
          body_html: `<p>Dear ${userName},</p><p>You have requested to reset your password. Please click the following link to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>If you did not request a password reset, please ignore this email.</p><p>Best regards,<br/>The Team</p>`,
          status: 'pending'
        });

      if (emailError) {
        console.error('Error queuing password reset email:', emailError);
      } else {
        console.log('✅ Password reset email queued successfully');
      }

    } catch (error) {
      console.error('Exception in password reset email trigger:', error);
    }
  }

  async sendWelcomeEmail(userId: string): Promise<void> {
    try {
      console.log(`📧 Sending welcome email to user ${userId}`);

      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user for welcome email:', userError);
        return;
      }

      if (!userData) {
        console.warn('User not found for welcome email');
        return;
      }

      // Queue email notification
      const { error: emailError } = await supabase
        .from('email_notification_queue')
        .insert({
          user_id: userId,
          recipient_email: userData.email,
          subject: 'Welcome to Our Platform',
          body_text: `Dear ${userData.name},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team`,
          body_html: `<p>Dear ${userData.name},</p><p>Welcome to our platform! We're excited to have you on board.</p><p>Best regards,<br/>The Team</p>`,
          status: 'pending'
        });

      if (emailError) {
        console.error('Error queuing welcome email:', emailError);
      } else {
        console.log('✅ Welcome email queued successfully');
      }

    } catch (error) {
      console.error('Exception in welcome email trigger:', error);
    }
  }

  async sendPasswordResetEmail(userId: string, resetToken: string): Promise<void> {
    try {
      console.log(`📧 Sending password reset email to user ${userId}`);

      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user for password reset email:', userError);
        return;
      }

      if (!userData) {
        console.warn('User not found for password reset email');
        return;
      }

      const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

      // Queue email notification
      const { error: emailError } = await supabase
        .from('email_notification_queue')
        .insert({
          user_id: userId,
          recipient_email: userData.email,
          subject: 'Password Reset Request',
          body_text: `Dear ${userData.name},\n\nYou have requested to reset your password. Please click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nThe Team`,
          body_html: `<p>Dear ${userData.name},</p><p>You have requested to reset your password. Please click the following link to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>If you did not request a password reset, please ignore this email.</p><p>Best regards,<br/>The Team</p>`,
          status: 'pending'
        });

      if (emailError) {
        console.error('Error queuing password reset email:', emailError);
      } else {
        console.log('✅ Password reset email queued successfully');
      }

    } catch (error) {
      console.error('Exception in password reset email trigger:', error);
    }
  }

  async sendVehicleAssignmentNotification(vehicleId: string, userId: string): Promise<void> {
    try {
      console.log(`📧 Sending vehicle assignment notification for vehicle ${vehicleId} to user ${userId}`);

      // Get vehicle and user information
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          envio_users (
            id,
            name,
            email
          )
        `)
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .single();

      if (vehicleError) {
        console.error('Error fetching vehicle for email notification:', vehicleError);
        return;
      }

      if (!vehicleData || !vehicleData.envio_users) {
        console.warn('Vehicle or user not found for email notification');
        return;
      }

      const user = vehicleData.envio_users;
      const vehicleName = vehicleData.name;

      // Queue email notification
      const { error: emailError } = await supabase
        .from('email_notification_queue')
        .insert({
          user_id: userId,
          recipient_email: user.email,
          subject: 'Vehicle Assignment Notification',
          body_text: `Dear ${user.name},\n\nA vehicle has been assigned to your account:\n\nVehicle: ${vehicleName}\nDevice ID: ${vehicleData.gp51_device_id}\n\nYou can now track this vehicle in your dashboard.\n\nBest regards,\nFleet Management Team`,
          body_html: `<p>Dear ${user.name},</p><p>A vehicle has been assigned to your account:</p><ul><li><strong>Vehicle:</strong> ${vehicleName}</li><li><strong>Device ID:</strong> ${vehicleData.gp51_device_id}</li></ul><p>You can now track this vehicle in your dashboard.</p><p>Best regards,<br/>Fleet Management Team</p>`,
          status: 'pending'
        });

      if (emailError) {
        console.error('Error queuing vehicle assignment email:', emailError);
      } else {
        console.log('✅ Vehicle assignment email notification queued successfully');
      }

    } catch (error) {
      console.error('Exception in vehicle assignment notification:', error);
    }
  }

  async sendAccountStatusChangeNotification(userId: string, status: string): Promise<void> {
    try {
      console.log(`📧 Sending account status change notification to user ${userId}`);

      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user for account status change email:', userError);
        return;
      }

      if (!userData) {
        console.warn('User not found for account status change email');
        return;
      }

      // Queue email notification
      const { error: emailError } = await supabase
        .from('email_notification_queue')
        .insert({
          user_id: userId,
          recipient_email: userData.email,
          subject: 'Account Status Change Notification',
          body_text: `Dear ${userData.name},\n\nYour account status has been changed to ${status}.\n\nBest regards,\nThe Team`,
          body_html: `<p>Dear ${userData.name},</p><p>Your account status has been changed to ${status}.</p><p>Best regards,<br/>The Team</p>`,
          status: 'pending'
        });

      if (emailError) {
        console.error('Error queuing account status change email:', emailError);
      } else {
        console.log('✅ Account status change email queued successfully');
      }

    } catch (error) {
      console.error('Exception in account status change notification:', error);
    }
  }
}

export const userEmailTriggers = new UserEmailTriggers();
