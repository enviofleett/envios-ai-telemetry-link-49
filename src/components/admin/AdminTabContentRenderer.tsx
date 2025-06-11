
import React from 'react';
import EnhancedAdminTabRenderer from './EnhancedAdminTabRenderer';

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = ({ activeTab }) => {
  return <EnhancedAdminTabRenderer activeTab={activeTab} />;
};

export default AdminTabContentRenderer;
