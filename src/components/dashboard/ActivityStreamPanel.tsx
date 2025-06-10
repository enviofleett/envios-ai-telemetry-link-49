
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Car, 
  Users,
  Wrench,
  MapPin
} from 'lucide-react';

const ActivityStreamPanel: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'vehicle_update',
      title: 'Vehicle V-001 location updated',
      description: 'Now at Downtown Office parking',
      timestamp: '2 minutes ago',
      icon: <MapPin className="h-4 w-4" />,
      status: 'info'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Low fuel alert - Vehicle V-004',
      description: 'Fuel level at 30%, refuel recommended',
      timestamp: '5 minutes ago',
      icon: <AlertTriangle className="h-4 w-4" />,
      status: 'warning'
    },
    {
      id: 3,
      type: 'maintenance',
      title: 'Scheduled maintenance completed',
      description: 'Vehicle V-002 service completed successfully',
      timestamp: '15 minutes ago',
      icon: <Wrench className="h-4 w-4" />,
      status: 'success'
    },
    {
      id: 4,
      type: 'user',
      title: 'New driver assigned',
      description: 'John Smith assigned to Vehicle V-003',
      timestamp: '1 hour ago',
      icon: <Users className="h-4 w-4" />,
      status: 'info'
    },
    {
      id: 5,
      type: 'system',
      title: 'GPS tracking resumed',
      description: 'All vehicles back online after maintenance window',
      timestamp: '2 hours ago',
      icon: <CheckCircle className="h-4 w-4" />,
      status: 'success'
    },
    {
      id: 6,
      type: 'vehicle_update',
      title: 'Route optimization applied',
      description: 'Estimated 15% efficiency improvement',
      timestamp: '3 hours ago',
      icon: <Activity className="h-4 w-4" />,
      status: 'info'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Stream
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className={`mt-1 ${getStatusColor(activity.status)}`}>
                {activity.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </h4>
                  <Badge className={`${getStatusBadge(activity.status)} text-xs`}>
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Activity
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityStreamPanel;
