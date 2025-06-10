
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, Camera, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { VehicleInspection } from '@/types/vehicle-inspection';
import InspectionList from './InspectionList';
import CreateInspectionModal from './CreateInspectionModal';
import InspectionDetailsModal from './InspectionDetailsModal';

const VehicleInspectionManager: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<VehicleInspection | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Mock data - in real app, this would come from a hook
  const inspections: VehicleInspection[] = [];
  
  const getStatusBadge = (status: VehicleInspection['inspection_status']) => {
    const variants = {
      scheduled: 'default',
      in_progress: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
      failed: 'destructive'
    } as const;

    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const statsCards = [
    {
      title: 'Scheduled Inspections',
      value: '8',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'In Progress',
      value: '3',
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Completed Today',
      value: '12',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Issues Found',
      value: '5',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Inspections</h1>
          <p className="text-muted-foreground">
            Manage vehicle inspections and maintenance checks
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Inspection
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inspection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <InspectionList
            inspections={inspections}
            onInspectionSelect={setSelectedInspection}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <InspectionList
            inspections={inspections.filter(i => i.inspection_status === 'scheduled')}
            onInspectionSelect={setSelectedInspection}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          <InspectionList
            inspections={inspections.filter(i => i.inspection_status === 'in_progress')}
            onInspectionSelect={setSelectedInspection}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <InspectionList
            inspections={inspections.filter(i => i.inspection_status === 'completed')}
            onInspectionSelect={setSelectedInspection}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <InspectionList
            inspections={inspections.filter(i => i.overall_result === 'fail' || i.overall_result === 'conditional')}
            onInspectionSelect={setSelectedInspection}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateInspectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => {
          console.log('Creating inspection:', data);
          setShowCreateModal(false);
        }}
      />

      {selectedInspection && (
        <InspectionDetailsModal
          inspection={selectedInspection}
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
};

export default VehicleInspectionManager;
