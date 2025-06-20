
import React from 'react';
import GP51UserMappingManager from '../GP51UserMappingManager';

const GP51UserMappingTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">GP51 User Account Mapping</h2>
        <p className="text-muted-foreground">
          Manage connections between your Envio account and GP51 usernames. 
          This allows you to access vehicles from different GP51 accounts.
        </p>
      </div>
      
      <GP51UserMappingManager />
    </div>
  );
};

export default GP51UserMappingTab;
