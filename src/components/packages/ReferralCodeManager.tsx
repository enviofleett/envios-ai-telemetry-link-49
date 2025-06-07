
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Check } from 'lucide-react';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import { useToast } from '@/hooks/use-toast';
import type { ReferralCode } from '@/types/subscriber-packages';

const ReferralCodeManager: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({
    code: '',
    discount_percentage: 0,
    usage_limit: undefined as number | undefined,
    expires_at: ''
  });

  const { toast } = useToast();

  const { data: referralCodes, isLoading, refetch } = useQuery({
    queryKey: ['referral-codes'],
    queryFn: subscriberPackageApi.getReferralCodes
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = async () => {
    if (!newCode.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Referral code is required.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      await subscriberPackageApi.createReferralCode({
        ...newCode,
        expires_at: newCode.expires_at ? new Date(newCode.expires_at).toISOString() : undefined
      });
      
      toast({
        title: "Referral code created",
        description: "The referral code has been successfully created."
      });
      
      setNewCode({
        code: '',
        discount_percentage: 0,
        usage_limit: undefined,
        expires_at: ''
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create referral code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code to clipboard.",
        variant: "destructive"
      });
    }
  };

  const isCodeExpired = (expiresAt: string | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isCodeAtLimit = (code: ReferralCode) => {
    return code.usage_limit && code.usage_count >= code.usage_limit;
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
              <Label htmlFor="code">Referral Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={newCode.code}
                  onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Enter code"
                  className="uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewCode(prev => ({ ...prev, code: generateRandomCode() }))}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount Percentage</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newCode.discount_percentage || ''}
                onChange={(e) => setNewCode(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
              <Input
                id="usage_limit"
                type="number"
                min="1"
                value={newCode.usage_limit || ''}
                onChange={(e) => setNewCode(prev => ({ ...prev, usage_limit: parseInt(e.target.value) || undefined }))}
                placeholder="Unlimited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date (optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={newCode.expires_at}
                onChange={(e) => setNewCode(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleCreateCode} disabled={isCreating} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Referral Code'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Referral Codes</h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
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
                    <span className="text-sm text-muted-foreground">Discount</span>
                    <Badge variant="secondary">{code.discount_percentage}%</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Usage</span>
                    <span className="text-sm">
                      {code.usage_count} / {code.usage_limit || '∞'}
                    </span>
                  </div>

                  {code.expires_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expires</span>
                      <span className="text-sm">
                        {new Date(code.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Badge 
                      variant={
                        !code.is_active ? 'secondary' :
                        isCodeExpired(code.expires_at) ? 'destructive' :
                        isCodeAtLimit(code) ? 'outline' : 'default'
                      }
                    >
                      {!code.is_active ? 'Inactive' :
                       isCodeExpired(code.expires_at) ? 'Expired' :
                       isCodeAtLimit(code) ? 'At Limit' : 'Active'}
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
