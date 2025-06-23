
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Workshop, WorkshopStats } from '@/types/workshop';

export const useWorkshopManagement = () => {
  const [allWorkshops, setAllWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [workshopStats, setWorkshopStats] = useState<WorkshopStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    // Mock data since workshops table was removed
    const mockWorkshops: Workshop[] = [];
    setAllWorkshops(mockWorkshops);
    setWorkshopStats({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    });
    setIsLoading(false);
  }, []);

  const approveWorkshop = async ({ workshopId, notes }: { workshopId: string; notes?: string }) => {
    setIsApproving(true);
    try {
      // Mock approval since workshops table was removed
      toast({
        title: "Workshop Approved",
        description: "The workshop has been approved successfully.",
      });
    } catch (error) {
      console.error('Error approving workshop:', error);
      toast({
        title: "Error",
        description: "Failed to approve workshop.",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const rejectWorkshop = async ({ workshopId, reason }: { workshopId: string; reason: string }) => {
    setIsRejecting(true);
    try {
      // Mock rejection since workshops table was removed
      toast({
        title: "Workshop Rejected",
        description: "The workshop has been rejected.",
      });
    } catch (error) {
      console.error('Error rejecting workshop:', error);
      toast({
        title: "Error",
        description: "Failed to reject workshop.",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return {
    allWorkshops,
    isLoading,
    approveWorkshop,
    rejectWorkshop,
    isApproving,
    isRejecting,
    workshopStats
  };
};
