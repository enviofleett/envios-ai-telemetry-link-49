
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RegistrationService } from '@/services/registrationService';
import type { Package, PendingRegistration } from '@/types/registration';

export const useRegistrationManagement = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const result = await RegistrationService.getPackages();
      if (result.success) {
        setPackages(result.packages || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load packages",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRegistrations = async () => {
    setIsLoading(true);
    try {
      const result = await RegistrationService.getPendingRegistrations();
      if (result.success) {
        setPendingRegistrations(result.registrations || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load pending registrations",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processRegistration = async (
    registrationId: string, 
    action: 'approve' | 'reject', 
    adminNotes?: string
  ) => {
    try {
      const result = await RegistrationService.processRegistration(registrationId, action, adminNotes);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Registration ${action}d successfully`,
        });
        // Reload pending registrations
        await loadPendingRegistrations();
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${action} registration`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} registration`,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  return {
    packages,
    pendingRegistrations,
    isLoading,
    loadPackages,
    loadPendingRegistrations,
    processRegistration
  };
};
