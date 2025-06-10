
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, MapPin, Settings, Download, Upload } from 'lucide-react';

const QuickActionsPanel: React.FC = () => {
  const quickActions = [
    {
      title: 'Add New Vehicle',
      description: 'Register a new GPS51 device',
      icon: Plus,
      action: () => console.log('Add vehicle'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Manage Users',
      description: 'Add or edit user accounts',
      icon: Users,
      action: () => console.log('Manage users'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Live Map',
      description: 'See all vehicles in real-time',
      icon: MapPin,
      action: () => console.log('View map'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'System Settings',
      description: 'Configure GPS51 parameters',
      icon: Settings,
      action: () => console.log('Settings'),
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      title: 'Export Data',
      description: 'Download reports and logs',
      icon: Download,
      action: () => console.log('Export'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Import Devices',
      description: 'Bulk import GPS51 devices',
      icon: Upload,
      action: () => console.log('Import'),
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto p-4 hover:bg-gray-50"
              onClick={action.action}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
