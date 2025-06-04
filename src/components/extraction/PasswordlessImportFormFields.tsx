
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PasswordlessImportFormFieldsProps {
  jobName: string;
  setJobName: (value: string) => void;
  usernamesText: string;
  setUsernamesText: (value: string) => void;
  isProcessing: boolean;
}

const PasswordlessImportFormFields: React.FC<PasswordlessImportFormFieldsProps> = ({
  jobName,
  setJobName,
  usernamesText,
  setUsernamesText,
  isProcessing
}) => {
  return (
    <>
      <div>
        <Label htmlFor="jobName">Job Name</Label>
        <Input
          id="jobName"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="e.g., Q1 2024 User Migration"
          disabled={isProcessing}
        />
      </div>

      <div>
        <Label htmlFor="usernames">GP51 Usernames to Import</Label>
        <Textarea
          id="usernames"
          value={usernamesText}
          onChange={(e) => setUsernamesText(e.target.value)}
          placeholder="username1&#10;username2&#10;username3"
          rows={6}
          disabled={isProcessing}
        />
        <p className="text-sm text-gray-600 mt-1">
          Enter one username per line
        </p>
      </div>
    </>
  );
};

export default PasswordlessImportFormFields;
