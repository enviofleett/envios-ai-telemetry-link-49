
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Car, User, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

const ActivityStreamPanel: React.FC = () => {
  // Mock data - in real implementation, this would come from your API
  const activities = [
    {
      id: 1,
      type: 'device_online',
      message: 'Vehicle VH001 came online',
      timestamp: '2 minutes ago',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'user_login',
      message: 'John Doe signed in',
      timestamp: '5 minutes ago',
      icon: User,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'location_update',
      message: 'Vehicle VH002 location updated',
      timestamp: '8 minutes ago',
      icon: MapPin,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'alert',
      message: 'Low battery alert for VH003',
      timestamp: '12 minutes ago',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 5,
      type: 'device_added',
      message: 'New vehicle VH004 registered',
      timestamp: '1 hour ago',
      icon: Car,
      color: 'text-green-600'
    }
  ];

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'device_online':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'user_login':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Login</Badge>;
      case 'location_update':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Location</Badge>;
      case 'alert':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Alert</Badge>;
      case 'device_added':
        return <Badge className="bg-green-100 text-green-800 border-green-200">New Device</Badge>;
      default:
        return <Badge variant="secondary">Activity</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-full bg-gray-100 ${activity.color}`}>
                <activity.icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  {getActivityBadge(activity.type)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityStreamPanel;
