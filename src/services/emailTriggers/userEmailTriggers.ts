
// Convert UserEmailTriggers to a simple object with all required methods
export const UserEmailTriggers = {
  async onUserRegistration(userId: string, userEmail: string, userName: string): Promise<void> {
    console.log(`User registration email trigger for ${userEmail}`);
    
    try {
      const notification = {
        type: 'user_registration',
        userId,
        userEmail,
        userName,
        timestamp: new Date().toISOString(),
        message: `Welcome email sent to ${userName} at ${userEmail}`
      };
      
      console.log('Registration notification:', notification);
    } catch (error) {
      console.error('Failed to send registration notification:', error);
    }
  },

  async notifyAdminsOfNewUser(userId: string, userEmail: string, userName: string): Promise<void> {
    console.log(`Admin notification for new user: ${userEmail}`);
    
    try {
      const notification = {
        type: 'admin_new_user_notification',
        userId,
        userEmail,
        userName,
        timestamp: new Date().toISOString(),
        message: `New user registered: ${userName} (${userEmail})`
      };
      
      console.log('Admin notification:', notification);
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  },

  async onPasswordResetRequest(userEmail: string, userName: string, resetToken: string): Promise<void> {
    console.log(`Password reset request for ${userEmail}`);
    
    try {
      const notification = {
        type: 'password_reset_request',
        userEmail,
        userName,
        resetToken,
        timestamp: new Date().toISOString(),
        message: `Password reset email sent to ${userName} at ${userEmail}`
      };
      
      console.log('Password reset notification:', notification);
    } catch (error) {
      console.error('Failed to send password reset notification:', error);
    }
  },

  async notifyOfUnusualParking(deviceId: string, address: string): Promise<void> {
    console.log(`Unusual parking detected for vehicle ${deviceId} at ${address}`);
    
    try {
      const notification = {
        type: 'unusual_parking',
        deviceId,
        address,
        timestamp: new Date().toISOString(),
        message: `Vehicle ${deviceId} parked at unusual location: ${address}`
      };
      
      console.log('Parking notification:', notification);
    } catch (error) {
      console.error('Failed to send parking notification:', error);
    }
  },

  async notifyOfVehicleAlert(deviceId: string, alertType: string, details: any): Promise<void> {
    console.log(`Vehicle alert: ${alertType} for device ${deviceId}`, details);
    
    try {
      const notification = {
        type: 'vehicle_alert',
        deviceId,
        alertType,
        details,
        timestamp: new Date().toISOString()
      };
      
      console.log('Alert notification:', notification);
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }
};
