
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Edit, Trash2, TestTube, AlertTriangle } from 'lucide-react';
import { maskCredential } from './validation';
import type { ApiCredential } from './types';

interface CredentialItemProps {
  credential: ApiCredential;
  onEdit: (credential: ApiCredential) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => Promise<boolean>;
}

const CredentialItem: React.FC<CredentialItemProps> = ({
  credential,
  onEdit,
  onDelete,
  onTest
}) => {
  const [showSecrets, setShowSecrets] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleTest = async () => {
    setIsTestLoading(true);
    try {
      const result = await onTest(credential.id);
      setTestResult(result);
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      setTestResult(false);
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setIsTestLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!credential.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (credential.expires_at) {
      const expirationDate = new Date(credential.expires_at);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 0) {
        return <Badge variant="destructive">Expired</Badge>;
      } else if (daysUntilExpiry <= 7) {
        return <Badge variant="outline" className="border-orange-500 text-orange-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expires in {daysUntilExpiry} days
        </Badge>;
      }
    }

    return <Badge className="bg-green-500">Active</Badge>;
  };

  const renderCredentialInfo = () => {
    switch (credential.credential_type) {
      case 'api_key':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">API Key:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {showSecrets ? credential.api_key : maskCredential(credential.api_key || '')}
              </code>
            </div>
          </div>
        );

      case 'oauth':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Client ID:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {credential.client_id}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Client Secret:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {showSecrets ? credential.client_secret : maskCredential(credential.client_secret || '')}
              </code>
            </div>
          </div>
        );

      case 'basic_auth':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Username:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {credential.api_key}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Password:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {showSecrets ? credential.secret_key : maskCredential(credential.secret_key || '')}
              </code>
            </div>
          </div>
        );

      case 'jwt':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">JWT Secret:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {showSecrets ? credential.secret_key : maskCredential(credential.secret_key || '')}
              </code>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{credential.name}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Badge variant="outline">{credential.credential_type}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Provider:</span>
            <div>{credential.provider}</div>
          </div>
          <div>
            <span className="font-medium">Created:</span>
            <div>{new Date(credential.created_at).toLocaleDateString()}</div>
          </div>
          {credential.last_used_at && (
            <div>
              <span className="font-medium">Last Used:</span>
              <div>{new Date(credential.last_used_at).toLocaleDateString()}</div>
            </div>
          )}
          {credential.expires_at && (
            <div>
              <span className="font-medium">Expires:</span>
              <div>{new Date(credential.expires_at).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {renderCredentialInfo()}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSecrets(!showSecrets)}
          >
            {showSecrets ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSecrets ? 'Hide' : 'Show'} Secrets
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTestLoading}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTestLoading ? 'Testing...' : 'Test'}
            </Button>
            {testResult !== null && (
              <Badge variant={testResult ? "default" : "destructive"}>
                {testResult ? 'Success' : 'Failed'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(credential)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(credential.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CredentialItem;
