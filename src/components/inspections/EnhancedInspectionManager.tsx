
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Users, Settings, FileText, Calendar } from 'lucide-react';
import InspectionFormBuilder from './InspectionFormBuilder';
import VehicleInspectionManager from './VehicleInspectionManager';
import WorkshopPermissionsManager from '../workshops/WorkshopPermissionsManager';
import WorkshopPaymentSystem from '../workshops/WorkshopPaymentSystem';

interface EnhancedInspectionManagerProps {
  workshopId: string;
}

const EnhancedInspectionManager: React.FC<EnhancedInspectionManagerProps> = ({
  workshopId
}) => {
  const [activeTab, setActiveTab] = useState('inspections');
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSaveTemplate = (template: any) => {
    // This will be implemented with the form builder logic
    console.log('Saving template:', template);
    setShowFormBuilder(false);
    setSelectedTemplate(null);
  };

  const tabs = [
    {
      id: 'inspections',
      label: 'Inspections',
      icon: ClipboardList,
      component: () => <VehicleInspectionManager workshopId={workshopId} />
    },
    {
      id: 'forms',
      label: 'Form Builder',
      icon: FileText,
      component: () => (
        <div className="space-y-6">
          {showFormBuilder ? (
            <InspectionFormBuilder
              workshopId={workshopId}
              existingTemplate={selectedTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setShowFormBuilder(false);
                setSelectedTemplate(null);
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Form Templates</CardTitle>
                <CardDescription>
                  Create and manage custom inspection forms for your workshop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <button
                    onClick={() => setShowFormBuilder(true)}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Create your first inspection form template
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: Users,
      component: () => <WorkshopPermissionsManager workshopId={workshopId} />
    },
    {
      id: 'payments',
      label: 'Payment System',
      icon: Calendar,
      component: () => <WorkshopPaymentSystem workshopId={workshopId} />
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workshop Management</h1>
          <p className="text-muted-foreground">
            Manage inspections, staff, and payments for your workshop
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Enhanced System
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            {ActiveComponent && tab.id === activeTab && <ActiveComponent />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default EnhancedInspectionManager;
