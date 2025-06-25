
import React from 'react';
import GPS51DiagnosticDashboard from '../GPS51DiagnosticDashboard';

const GP51DiagnosticsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">GPS51 System Diagnostics</h2>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive diagnostic tools for GPS51 integration monitoring and troubleshooting
        </p>
      </div>
      
      <GPS51DiagnosticDashboard />
    </div>
  );
};

export default GP51DiagnosticsTab;
