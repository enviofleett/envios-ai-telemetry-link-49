
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { referralApi } from '@/services/referral';
import type { ReferralAgentWithUserDetails, ReferralAgentStatus } from '@/types/referral';
import { toast } from 'sonner';

interface ReferralAgentListProps {
  agents: ReferralAgentWithUserDetails[];
}

const statusOptions: ReferralAgentStatus[] = ['pending_approval', 'active', 'suspended', 'rejected'];

const ReferralAgentList: React.FC<ReferralAgentListProps> = ({ agents }) => {
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ agentId, status }: { agentId: string, status: ReferralAgentStatus }) => 
      referralApi.updateReferralAgentStatus(agentId, status),
    onSuccess: (data) => {
      toast.success(`Agent status updated to ${data.status.replace(/_/g, ' ')}.`);
      queryClient.invalidateQueries({ queryKey: ['referral-agents'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleStatusChange = (agentId: string, newStatus: ReferralAgentStatus) => {
    updateStatus({ agentId, status: newStatus });
  };
  
  const getBadgeVariant = (status: ReferralAgentStatus) => {
      switch (status) {
          case 'active': return 'default';
          case 'pending_approval': return 'secondary';
          case 'suspended': return 'destructive';
          case 'rejected': return 'outline';
          default: return 'secondary';
      }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined On</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell className="font-medium">{agent.name}</TableCell>
            <TableCell>{agent.email}</TableCell>
            <TableCell>
              <Badge variant={getBadgeVariant(agent.status)} className="capitalize">
                {agent.status.replace(/_/g, ' ')}
              </Badge>
            </TableCell>
            <TableCell>{new Date(agent.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
               <Select
                value={agent.status}
                onValueChange={(newStatus: ReferralAgentStatus) => handleStatusChange(agent.id, newStatus)}
                disabled={isPending}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ReferralAgentList;
