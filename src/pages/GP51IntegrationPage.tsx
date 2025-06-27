
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import GP51IntegrationTab from '@/components/admin/tabs/GP51IntegrationTab';

const GP51IntegrationPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">GP51 Integration</h1>
        <p className="text-gray-600 mt-2">Manage your GP51 fleet tracking integration</p>
      </div>
      <GP51IntegrationTab />
    </div>
  );
};

export default GP51IntegrationPage;
