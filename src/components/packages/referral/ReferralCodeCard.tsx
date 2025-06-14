import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { ReferralCode } from '@/types/referral';

interface ReferralCodeCardProps {
  code: ReferralCode;
  agentName?: string;
}

const ReferralCodeCard: React.FC<ReferralCodeCardProps> = ({ code, agentName }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (codeToCopy: string) => {
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(codeToCopy);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success("Copied!", { description: "Referral code copied to clipboard." });
    } catch (error) {
      toast.error("Error", { description: "Failed to copy code to clipboard." });
    }
  };

  return (
    <Card className="relative">
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

        {agentName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Agent</span>
            <span className="text-sm font-medium truncate" title={agentName}>
              {agentName}
            </span>
          </div>
        )}

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
  );
};

export default ReferralCodeCard;
