
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Alert {
  id: number;
  message: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low';
}

const RealTimeAlertsPanel: React.FC = () => {
  const alerts: Alert[] = [
    {
      id: 1,
      message: "Vehicle #4523 battery critical",
      time: "2 mins ago",
      priority: "High"
    },
    {
      id: 2,
      message: "Geofence violation detected",
      time: "5 mins ago",
      priority: "High"
    },
    {
      id: 3,
      message: "Maintenance due for Vehicle #7821",
      time: "15 mins ago",
      priority: "Medium"
    },
    {
      id: 4,
      message: "GPS signal lost for Vehicle #3456",
      time: "18 mins ago",
      priority: "Low"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#ef4444';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-lg font-semibold text-primary-dark">
          Real-time Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-gray-lighter rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: getPriorityColor(alert.priority) }}
                ></div>
                <div className="flex-1">
                  <div className="text-sm text-primary-dark">
                    {alert.message}
                  </div>
                  <div className="text-xs text-gray-mid mt-1">
                    {alert.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeAlertsPanel;
