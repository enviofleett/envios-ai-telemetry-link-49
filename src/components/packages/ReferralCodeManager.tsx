
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Check, Loader2 } from 'lucide-react';
import { referralApi } from '@/services/referralApi';
import { toast } from 'sonner';
import type { ReferralCode } from '@/types/referral';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ReferralCodeManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();

  const { data: referralCodes, isLoading: isLoadingCodes } = useQuery({
    queryKey: ['referral-codes'],
    queryFn: referralApi.getReferralCodes,
  });

  const { data: referralAgents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['referral-agents'],
    queryFn: referralApi.getReferralAgents,
  });

  const { mutate: createCode, isPending: isCreating } = useMutation({
    mutationFn: referralApi.createReferralCode,
    onSuccess: () => {
      toast.success("Referral code created successfully!");
      queryClient.invalidateQueries({ queryKey: ['referral-codes'] });
      setNewCode('');
      // This is a controlled component, so we don't reset selectedAgentId here to avoid weird UI behavior.
      // The form can be submitted again with the same agent.
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

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success("Copied!", { description: "Referral code copied to clipboard." });
    } catch (error) {
      toast.error("Error", { description: "Failed to copy code to clipboard." });
    }
  };

  return (
    <div className="space-y-6">
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
                  {referralAgents?.map((agent) => (
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Referral Codes</h3>
        
        {isLoadingCodes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referralCodes?.map((code) => (
              <Card key={code.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code.code)}
                    >
                      {copiedCode === code.code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Usage Count</span>
                    <span className="text-sm font-medium">
                      {code.usage_count}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Agent ID</span>
                     <span className="text-xs font-mono text-muted-foreground truncate" title={code.agent_id}>
                      ...{code.agent_id.slice(-12)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant={code.is_active ? 'default' : 'secondary'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(code.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralCodeManager;
