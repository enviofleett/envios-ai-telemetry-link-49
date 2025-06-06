
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface GP51FormFieldsProps {
  username: string;
  password: string;
  apiUrl?: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onApiUrlChange?: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const GP51FormFields: React.FC<GP51FormFieldsProps> = ({
  username,
  password,
  apiUrl = '',
  onUsernameChange,
  onPasswordChange,
  onApiUrlChange,
  onSubmit,
  isLoading
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="gp51-api-url">GP51 API URL (Optional)</Label>
        <Input
          id="gp51-api-url"
          type="url"
          value={apiUrl}
          onChange={(e) => onApiUrlChange?.(e.target.value)}
          placeholder="e.g., https://api.gps51.com (leave empty to use default)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter your GP51 API URL. Leave empty to use the system default.
        </p>
      </div>

      <div>
        <Label htmlFor="gp51-username">GP51 Username</Label>
        <Input
          id="gp51-username"
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="Enter your GP51 username"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="gp51-password">GP51 Password</Label>
        <Input
          id="gp51-password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Enter your GP51 password"
          required
        />
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Connecting...' : 'Save & Connect'}
      </Button>
    </form>
  );
};

export default GP51FormFields;
