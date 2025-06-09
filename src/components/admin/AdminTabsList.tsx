
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Upload, 
  Building, 
  CreditCard, 
  Users, 
  Bell, 
  Satellite, 
  Activity, 
  Map, 
  BarChart3, 
  Shield, 
  Mail, 
  BookOpen,
  TestTube
} from 'lucide-react';

const AdminTabsList = () => {
  return (
    <TabsList className="grid w-full grid-cols-7 lg:grid-cols-14 gap-1">
      <TabsTrigger value="packages" className="flex items-center gap-1">
        <Package className="h-4 w-4" />
        <span className="hidden sm:inline">Packages</span>
      </TabsTrigger>
      <TabsTrigger value="csv-import" className="flex items-center gap-1">
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">CSV</span>
      </TabsTrigger>
      <TabsTrigger value="company" className="flex items-center gap-1">
        <Building className="h-4 w-4" />
        <span className="hidden sm:inline">Company</span>
      </TabsTrigger>
      <TabsTrigger value="billing" className="flex items-center gap-1">
        <CreditCard className="h-4 w-4" />
        <span className="hidden sm:inline">Billing</span>
      </TabsTrigger>
      <TabsTrigger value="users" className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">Users</span>
      </TabsTrigger>
      <TabsTrigger value="notifications" className="flex items-center gap-1">
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Alerts</span>
      </TabsTrigger>
      <TabsTrigger value="gp51-integration" className="flex items-center gap-1">
        <Satellite className="h-4 w-4" />
        <span className="hidden sm:inline">GP51</span>
      </TabsTrigger>
      <TabsTrigger value="health" className="flex items-center gap-1">
        <Activity className="h-4 w-4" />
        <span className="hidden sm:inline">Health</span>
      </TabsTrigger>
      <TabsTrigger value="maps" className="flex items-center gap-1">
        <Map className="h-4 w-4" />
        <span className="hidden sm:inline">Maps</span>
      </TabsTrigger>
      <TabsTrigger value="analytics" className="flex items-center gap-1">
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Analytics</span>
      </TabsTrigger>
      <TabsTrigger value="geofencing" className="flex items-center gap-1">
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline">Geofence</span>
      </TabsTrigger>
      <TabsTrigger value="smtp-guide" className="flex items-center gap-1">
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">SMTP Guide</span>
      </TabsTrigger>
      <TabsTrigger value="smtp" className="flex items-center gap-1">
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">SMTP</span>
      </TabsTrigger>
      <TabsTrigger value="gp51-validation" className="flex items-center gap-1">
        <TestTube className="h-4 w-4" />
        <span className="hidden sm:inline">Validation</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default AdminTabsList;
