
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Wrench, AlertTriangle } from 'lucide-react';
import AppointmentsList from './AppointmentsList';
import AppointmentSchedulingModal from './AppointmentSchedulingModal';
import { useWorkshops } from '@/hooks/useWorkshops';
import { Workshop } from '@/types/workshop';

const AppointmentsManager: React.FC = () => {
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const { workshops } = useWorkshops();

  // Mock stats - in real app, these would come from the appointments hook
  const statsCards = [
    {
      title: 'Upcoming Appointments',
      value: '3',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'This Week',
      value: '5',
      icon: Clock,
      color: 'text-green-600'
    },
    {
      title: 'Total Scheduled',
      value: '12',
      icon: Wrench,
      color: 'text-purple-600'
    },
    {
      title: 'Needs Attention',
      value: '1',
      icon: AlertTriangle,
      color: 'text-orange-600'
    }
  ];

  const handleScheduleNew = () => {
    // For now, use the first workshop if available
    if (workshops && workshops.length > 0) {
      setSelectedWorkshop(workshops[0]);
      setShowSchedulingModal(true);
    } else {
      // Show workshop selection modal first
      alert('Please connect to a workshop first to schedule appointments.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Schedule and manage your vehicle service appointments
          </p>
        </div>
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

      {/* Appointments List */}
      <AppointmentsList onScheduleNew={handleScheduleNew} />

      {/* Scheduling Modal */}
      {selectedWorkshop && (
        <AppointmentSchedulingModal
          isOpen={showSchedulingModal}
          onClose={() => {
            setShowSchedulingModal(false);
            setSelectedWorkshop(null);
          }}
          workshop={selectedWorkshop}
        />
      )}
    </div>
  );
};

export default AppointmentsManager;
