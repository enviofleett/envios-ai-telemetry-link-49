import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { referralApi } from '@/services/referral';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReferralAgentWithUserDetails } from '@/types/referral';

interface CreateReferralCodeFormProps {
  agents: ReferralAgentWithUserDetails[] | undefined;
  isLoadingAgents: boolean;
}

const CreateReferralCodeForm: React.FC<CreateReferralCodeFormProps> = ({ agents, isLoadingAgents }) => {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();

  const { mutate: createCode, isPending: isCreating } = useMutation({
    mutationFn: referralApi.createReferralCode,
    onSuccess: () => {
      toast.success("Referral code created successfully!");
      queryClient.invalidateQueries({ queryKey: ['referral-codes'] });
      setNewCode('');
      // We don't reset selectedAgentId for better UX if creating multiple codes for the same agent
    },
    onError: (error: any) => {
      toast.error(`Failed to create code: ${error.message}`);
    },
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = () => {
    if (!newCode.trim()) {
      toast.error("Referral code is required.");
      return;
    }
    if (!selectedAgentId) {
      toast.error("An agent must be selected.");
      return;
    }

    createCode({
      code: newCode.trim().toUpperCase(),
      agent_id: selectedAgentId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Referral Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="agent">Assign to Agent *</Label>
            <Select onValueChange={setSelectedAgentId} value={selectedAgentId}>
              <SelectTrigger disabled={isLoadingAgents} id="agent">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAgents && <div className="p-4 text-sm text-muted-foreground">Loading agents...</div>}
                {agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Referral Code *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="E.g., SUMMERDEAL24"
                className="uppercase"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewCode(generateRandomCode())}
              >
                Generate
              </Button>
            </div>
          </div>
        </div>

        <Button onClick={handleCreateCode} disabled={isCreating || isLoadingAgents} className="w-full">
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isCreating ? 'Creating...' : 'Create Referral Code'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateReferralCodeForm;
