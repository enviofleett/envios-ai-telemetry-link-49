
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SystemImportManager from '@/components/admin/SystemImportManager';

const SystemImport: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GP51 System Import
          </h1>
          <p className="text-gray-600">
            Comprehensive data import and management for GP51 platform integration
          </p>
        </div>
        
        <SystemImportManager />
      </div>
    </div>
  );
};

export default SystemImport;
