
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { referralApi } from '@/services/referralApi';
import { toast } from 'sonner';

interface CreateAgentReferralCodeFormProps {
  agentId: string;
}

const CreateAgentReferralCodeForm: React.FC<CreateAgentReferralCodeFormProps> = ({ agentId }) => {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState('');

  const { mutate: createCode, isPending: isCreating } = useMutation({
    mutationFn: referralApi.createReferralCode,
    onSuccess: () => {
      toast.success("Referral code created successfully!");
      queryClient.invalidateQueries({ queryKey: ['referral-codes'] });
      setNewCode('');
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
      toast.error("Please enter or generate a referral code.");
      return;
    }

    createCode({
      code: newCode.trim().toUpperCase(),
      agent_id: agentId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Referral Code</CardTitle>
        <CardDescription>
          Create a unique code to track your referrals. You can create multiple codes for different campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Referral Code *</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="E.g., MYAGENTCODE"
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

        <Button onClick={handleCreateCode} disabled={isCreating} className="w-full md:w-auto">
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isCreating ? 'Creating...' : 'Create Code'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateAgentReferralCodeForm;
