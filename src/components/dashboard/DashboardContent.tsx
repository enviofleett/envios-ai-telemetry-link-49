
import React from 'react';
import SimpleDashboardContent from './SimpleDashboardContent';

export const DashboardContent: React.FC = () => {
  // At this point, we know the user is authenticated with both 
  // Supabase and GP51, so we can directly show the dashboard
  return <SimpleDashboardContent />;
};
