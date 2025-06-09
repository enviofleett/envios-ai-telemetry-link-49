
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Upload, 
  Building, 
  CreditCard, 
  Users, 
  Bell, 
  Plug, 
  Activity, 
  Map, 
  BarChart3, 
  Shield, 
  Mail, 
  CheckSquare,
  Settings,
  MailOpen,
  Wrench
} from 'lucide-react';

const AdminTabsList = () => {
  return (
    <ScrollArea className="w-full">
      <TabsList className="w-full justify-start flex-wrap h-auto p-1 gap-1">
        <TabsTrigger value="packages" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Packages
        </TabsTrigger>
        <TabsTrigger value="csv-import" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          CSV Import
        </TabsTrigger>
        <TabsTrigger value="company" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Company
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="workshops" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Workshops
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="gp51-integration" className="flex items-center gap-2">
          <Plug className="h-4 w-4" />
          GP51
        </TabsTrigger>
        <TabsTrigger value="health" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Health
        </TabsTrigger>
        <TabsTrigger value="maps" className="flex items-center gap-2">
          <Map className="h-4 w-4" />
          Maps
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="geofencing" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Geofencing
        </TabsTrigger>
        <TabsTrigger value="smtp-guide" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          SMTP Guide
        </TabsTrigger>
        <TabsTrigger value="smtp" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          SMTP
        </TabsTrigger>
        <TabsTrigger value="gp51-validation" className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          GP51 Validation
        </TabsTrigger>
        <TabsTrigger value="email-notifications" className="flex items-center gap-2">
          <MailOpen className="h-4 w-4" />
          Email Management
        </TabsTrigger>
      </TabsList>
    </ScrollArea>
  );
};

export default AdminTabsList;
