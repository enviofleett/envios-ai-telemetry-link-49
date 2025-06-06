
import React from 'react';

interface PerformanceMetrics {
  renderTime: number;
  reRenderCount: number;
}

interface UserPerformanceMetrics {
  totalUsers: number;
  selectedCount: number;
  currentSort: string;
  isSearchActive: boolean;
  pageInfo: string;
}

interface UserTablePerformanceMetricsProps {
  metrics: PerformanceMetrics;
  performanceMetrics: UserPerformanceMetrics;
  shouldUseVirtualScrolling: boolean;
}

const UserTablePerformanceMetrics: React.FC<UserTablePerformanceMetricsProps> = ({
  metrics,
  performanceMetrics,
  shouldUseVirtualScrolling
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
      <div className="flex items-center gap-4">
        <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
        <span>Re-renders: {metrics.reRenderCount}</span>
        <span>Users: {performanceMetrics.totalUsers}</span>
        <span>Selected: {performanceMetrics.selectedCount}</span>
        <span>Page: {performanceMetrics.pageInfo}</span>
        {shouldUseVirtualScrolling && <span className="text-blue-600">Virtual Scrolling</span>}
      </div>
    </div>
  );
};

export default UserTablePerformanceMetrics;
