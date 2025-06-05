import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Save, X } from 'lucide-react';
import { validateCredential } from './validation';
import type { ApiCredentialForm, ApiCredential } from './types';

interface CredentialFormProps {
  credential?: ApiCredential;
  onSave: (credential: ApiCredentialForm) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CredentialForm: React.FC<CredentialFormProps> = ({
  credential,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ApiCredentialForm>({
    name: credential?.name || '',
    credential_type: credential?.credential_type || 'api_key',
    provider: credential?.provider || '',
    api_key: credential?.api_key || '',
    secret_key: credential?.secret_key || '',
    client_id: credential?.client_id || '',
    client_secret: credential?.client_secret || '',
    additional_config: credential?.additional_config || {},
    expires_at: credential?.expires_at ? credential.expires_at.split('T')[0] : ''
  });

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCredential(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSave(formData);
      setErrors([]);
    } catch (error) {
      setErrors(['Failed to save credential']);
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderSecretInput = (
    field: keyof ApiCredentialForm,
    label: string,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <div className="relative">
        <Input
          id={field}
          type={showSecrets[field] ? 'text' : 'password'}
          value={formData[field] as string || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => toggleSecretVisibility(field)}
        >
          {showSecrets[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {credential ? 'Edit API Credential' : 'Add New API Credential'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My API Key"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="MapTiler, Google Maps, etc."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credential_type">Credential Type *</Label>
            <Select
              value={formData.credential_type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, credential_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
                <SelectItem value="basic_auth">Basic Authentication</SelectItem>
                <SelectItem value="jwt">JWT Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.credential_type === 'api_key' && (
            renderSecretInput('api_key', 'API Key *', 'Enter your API key')
          )}

          {formData.credential_type === 'oauth' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  value={formData.client_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  placeholder="Your OAuth client ID"
                />
              </div>
              {renderSecretInput('client_secret', 'Client Secret *', 'Your OAuth client secret')}
            </div>
          )}

          {formData.credential_type === 'basic_auth' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">Username *</Label>
                <Input
                  id="api_key"
                  value={formData.api_key || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Username"
                />
              </div>
              {renderSecretInput('secret_key', 'Password *', 'Password')}
            </div>
          )}

          {formData.credential_type === 'jwt' && (
            renderSecretInput('secret_key', 'JWT Secret *', 'Enter your JWT secret')
          )}

          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
            <Input
              id="expires_at"
              type="date"
              value={formData.expires_at || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_config">Additional Configuration (JSON)</Label>
            <Textarea
              id="additional_config"
              value={JSON.stringify(formData.additional_config, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, additional_config: config }));
                } catch {
                  // Invalid JSON, keep the text for user to fix
                }
              }}
              placeholder='{"key": "value"}'
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Credential'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CredentialForm;
