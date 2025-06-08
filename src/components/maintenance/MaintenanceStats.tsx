
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

interface MaintenanceItem {
  id: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
}

interface MaintenanceStatsProps {
  maintenanceItems: MaintenanceItem[];
}

export const MaintenanceStats: React.FC<MaintenanceStatsProps> = ({ maintenanceItems }) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {maintenanceItems.filter(item => item.status === 'scheduled').length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Wrench className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {maintenanceItems.filter(item => item.status === 'in-progress').length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {maintenanceItems.filter(item => item.status === 'overdue').length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {maintenanceItems.filter(item => item.status === 'completed').length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
