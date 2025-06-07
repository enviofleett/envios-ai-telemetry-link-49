
import React from 'react';
import { useUserManagementEmails } from '@/hooks/useUserManagementEmails';
import { useToast } from '@/hooks/use-toast';
import SimpleUserManagement from '@/components/users/SimpleUserManagement';

const UserManagementWithEmails: React.FC = () => {
  const { sendUserWelcomeEmail, sendUserPasswordReset, sendUserOTP } = useUserManagementEmails();
  const { toast } = useToast();

  // Enhanced user creation with welcome email
  const handleUserCreatedWithEmail = async (userData: {
    email: string;
    name: string;
    id: string;
  }) => {
    try {
      // Send welcome email after user creation
      await sendUserWelcomeEmail(userData.email, userData.name);
      
      toast({
        title: "User Created",
        description: `User ${userData.name} created successfully and welcome email sent.`,
      });
    } catch (error) {
      console.error('Error in user creation with email:', error);
      toast({
        title: "Partial Success",
        description: "User created but welcome email failed to send.",
        variant: "destructive"
      });
    }
  };

  // Enhanced password reset with email notification
  const handlePasswordResetWithEmail = async (userData: {
    email: string;
    name: string;
  }) => {
    try {
      // Generate reset link (this would normally come from your auth system)
      const resetLink = `${window.location.origin}/reset-password?token=reset_token_here`;
      
      await sendUserPasswordReset(userData.email, userData.name, resetLink);
      
      toast({
        title: "Password Reset Sent",
        description: `Password reset instructions sent to ${userData.email}`,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send password reset email.",
        variant: "destructive"
      });
    }
  };

  // Enhanced OTP verification with email
  const handleOTPRequestWithEmail = async (email: string) => {
    try {
      // Generate OTP (this would normally come from your OTP service)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      await sendUserOTP(email, otpCode, 10);
      
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending OTP email:', error);
      toast({
        title: "OTP Failed",
        description: "Failed to send verification code.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">Enhanced User Management</h2>
        <p className="text-muted-foreground">
          User management with integrated email notifications
        </p>
      </div>
      
      {/* Include the existing user management component */}
      <SimpleUserManagement />
      
      {/* Additional email management tools could go here */}
    </div>
  );
};

export default UserManagementWithEmails;
