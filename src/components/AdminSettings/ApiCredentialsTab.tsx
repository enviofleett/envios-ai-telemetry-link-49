
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Key, Shield, AlertCircle } from 'lucide-react';
import { useApiCredentials } from '@/hooks/useApiCredentials';
import CredentialForm from './api-credentials/CredentialForm';
import CredentialItem from './api-credentials/CredentialItem';
import type { ApiCredential, ApiCredentialForm } from './api-credentials/types';

const ApiCredentialsTab: React.FC = () => {
  const {
    credentials,
    isLoading,
    error,
    saveCredential,
    updateCredential,
    deleteCredential,
    testCredential
  } = useApiCredentials();

  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<ApiCredential | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleSave = async (formData: ApiCredentialForm) => {
    setFormLoading(true);
    try {
      if (editingCredential) {
        await updateCredential(editingCredential.id, formData);
      } else {
        await saveCredential(formData);
      }
      setShowForm(false);
      setEditingCredential(null);
    } catch (error) {
      console.error('Error saving credential:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (credential: ApiCredential) => {
    setEditingCredential(credential);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      try {
        await deleteCredential(id);
      } catch (error) {
        console.error('Error deleting credential:', error);
        alert('Failed to delete credential');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCredential(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-lg">Loading API credentials...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">API Credentials Management</h3>
          <p className="text-sm text-gray-600">
            Securely store and manage API credentials for various services
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        )}
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900">Security Notice</div>
              <div className="text-sm text-blue-700 mt-1">
                All API credentials are encrypted at rest and transmitted securely. 
                Only authorized users can access and manage these credentials.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <CredentialForm
          credential={editingCredential || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={formLoading}
        />
      )}

      {/* Credentials List */}
      <div className="space-y-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-900 mb-2">
                  No API credentials configured
                </div>
                <div className="text-gray-600 mb-4">
                  Add your first API credential to get started with secure API management.
                </div>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Credential
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5" />
              <span className="font-medium">
                {credentials.length} credential{credentials.length !== 1 ? 's' : ''} configured
              </span>
            </div>
            {credentials.map((credential) => (
              <CredentialItem
                key={credential.id}
                credential={credential}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={testCredential}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ApiCredentialsTab;
