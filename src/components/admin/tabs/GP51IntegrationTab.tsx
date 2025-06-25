import React from 'react';
import GP51Settings from '../GP51Settings';
import GP51ConnectionTester from '../GP51ConnectionTester';
import GP51DiagnosticsPanel from '../GP51DiagnosticsPanel';
import GP51DebugPanel from '../GP51DebugPanel';
import GP51HealthIndicator from '../GP51HealthIndicator';
import UnifiedImportPanel from '../UnifiedImportPanel';
import GP51RawDiagnosticPanel from '../GP51RawDiagnosticPanel';

interface GP51IntegrationTabProps {
  // Define any props if needed
}

const GP51IntegrationTab: React.FC = () => {
  // Define any state or handlers if needed

  return (
    <div className="space-y-6">
      <GP51HealthIndicator />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GP51Settings />
        <GP51ConnectionTester />
      </div>

      {/* Add the new diagnostic panel */}
      <GP51RawDiagnosticPanel />

      <GP51DiagnosticsPanel />
      <GP51DebugPanel />
      <UnifiedImportPanel />
    </div>
  );
};

export default GP51IntegrationTab;
