
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SystemStatus {
  name: string;
  status: 'Connected' | 'Active' | 'Degraded' | 'Offline';
}

const SystemHealthPanel: React.FC = () => {
  const systemStatuses: SystemStatus[] = [
    { name: 'GP51', status: 'Connected' },
    { name: 'Database', status: 'Active' },
    { name: 'SMS Gateway', status: 'Degraded' },
    { name: 'Email', status: 'Offline' }
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Connected':
      case 'Active':
        return {
          background: '#f0fdf4',
          border: '#dcfce7',
          dotColor: '#22c55e',
          badgeBackground: '#dcfce7',
          badgeText: '#16a34a'
        };
      case 'Degraded':
        return {
          background: '#fefce8',
          border: '#fef9c3',
          dotColor: '#f59e0b',
          badgeBackground: '#fef9c3',
          badgeText: '#d97706'
        };
      case 'Offline':
        return {
          background: '#fef2f2',
          border: '#fee2e2',
          dotColor: '#ef4444',
          badgeBackground: '#fee2e2',
          badgeText: '#dc2626'
        };
      default:
        return {
          background: '#f1f5f9',
          border: '#e2e8f0',
          dotColor: '#64748b',
          badgeBackground: '#e2e8f0',
          badgeText: '#475569'
        };
    }
  };

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-lg font-semibold text-primary-dark">
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {systemStatuses.map((system, index) => {
            const styles = getStatusStyles(system.status);
            return (
              <div
                key={index}
                className="h-14 rounded-lg p-3 border flex items-center justify-between"
                style={{ 
                  backgroundColor: styles.background,
                  borderColor: styles.border
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: styles.dotColor }}
                  ></div>
                  <span className="text-sm font-medium text-primary-dark">
                    {system.name}
                  </span>
                </div>
                <span
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{
                    backgroundColor: styles.badgeBackground,
                    color: styles.badgeText
                  }}
                >
                  {system.status}
                </span>
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-sm font-medium text-tertiary-dark mb-2">
            24h Performance Timeline
          </h3>
          <div className="h-[200px] bg-gray-very-light rounded border border-gray-lighter flex items-center justify-center">
            <span className="text-gray-mid text-sm">Performance Chart Placeholder</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthPanel;
