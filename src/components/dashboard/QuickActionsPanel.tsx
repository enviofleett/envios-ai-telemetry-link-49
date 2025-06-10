
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MapPin, 
  FileText, 
  Settings, 
  Users, 
  Car, 
  BarChart3,
  AlertTriangle
} from 'lucide-react';

const QuickActionsPanel: React.FC = () => {
  const quickActions = [
    {
      id: 'add-vehicle',
      title: 'Add Vehicle',
      description: 'Register new fleet vehicle',
      icon: <Plus className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => console.log('Add vehicle clicked')
    },
    {
      id: 'track-vehicle',
      title: 'Live Tracking',
      description: 'View real-time locations',
      icon: <MapPin className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => console.log('Live tracking clicked')
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create analytics report',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => console.log('Generate report clicked')
    },
    {
      id: 'manage-drivers',
      title: 'Manage Drivers',
      description: 'Driver assignments',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => console.log('Manage drivers clicked')
    }
  ];

  const systemActions = [
    {
      id: 'fleet-overview',
      title: 'Fleet Overview',
      icon: <Car className="h-4 w-4" />,
      badge: '4 vehicles'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      badge: 'Latest'
    },
    {
      id: 'alerts',
      title: 'Active Alerts',
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: '2 pending'
    },
    {
      id: 'settings',
      title: 'System Settings',
      icon: <Settings className="h-4 w-4" />,
      badge: 'Configure'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Primary Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white h-auto p-3 flex flex-col items-center gap-2`}
              >
                {action.icon}
                <div className="text-center">
                  <div className="text-xs font-medium">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* System Navigation */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">System Navigation</h3>
          <div className="space-y-2">
            {systemActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-between h-auto p-3"
                onClick={() => console.log(`${action.title} clicked`)}
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <span className="text-sm font-medium">{action.title}</span>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {action.badge}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-xs text-gray-600">Active Vehicles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-xs text-gray-600">Fleet Efficiency</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
