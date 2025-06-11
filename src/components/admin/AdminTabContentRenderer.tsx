
import React from 'react';
import EnhancedAdminTabRenderer from './EnhancedAdminTabRenderer';

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = ({ activeTab }) => {
  // Mapping for the gp51 tab id inconsistency
  const normalizedTab = activeTab === 'gp51-integration' ? 'gp51' : activeTab;
  return <EnhancedAdminTabRenderer activeTab={normalizedTab} />;
};

export default AdminTabContentRenderer;
