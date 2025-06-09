
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, Upload, Settings, User, Bell, Shield, Activity, Map, 
  BarChart3, MapPin, Book, Mail, Navigation 
} from 'lucide-react';

export default function AdminTabsList() {
  return (
    <TabsList className="grid w-full grid-cols-6 lg:grid-cols-13">
      <TabsTrigger value="packages" className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span className="hidden sm:inline">Packages</span>
      </TabsTrigger>
      <TabsTrigger value="csv-import" className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">CSV Import</span>
      </TabsTrigger>
      <TabsTrigger value="company" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Company</span>
      </TabsTrigger>
      <TabsTrigger value="billing" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Billing</span>
      </TabsTrigger>
      <TabsTrigger value="users" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Users</span>
      </TabsTrigger>
      <TabsTrigger value="notifications" className="flex items-center gap-2">
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Alerts</span>
      </TabsTrigger>
      <TabsTrigger value="gp51" className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline">GP51</span>
      </TabsTrigger>
      <TabsTrigger value="gps51" className="flex items-center gap-2">
        <Navigation className="h-4 w-4" />
        <span className="hidden sm:inline">GPS51</span>
      </TabsTrigger>
      <TabsTrigger value="health" className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        <span className="hidden sm:inline">Health</span>
      </TabsTrigger>
      <TabsTrigger value="maps" className="flex items-center gap-2">
        <Map className="h-4 w-4" />
        <span className="hidden sm:inline">Maps</span>
      </TabsTrigger>
      <TabsTrigger value="analytics" className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Analytics</span>
      </TabsTrigger>
      <TabsTrigger value="geofencing" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <span className="hidden sm:inline">Geofencing</span>
      </TabsTrigger>
      <TabsTrigger value="smtp-guide" className="flex items-center gap-2">
        <Book className="h-4 w-4" />
        <span className="hidden sm:inline">SMTP Setup</span>
      </TabsTrigger>
      <TabsTrigger value="smtp" className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">SMTP Config</span>
      </TabsTrigger>
    </TabsList>
  );
}
