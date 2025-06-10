
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailTemplateManager } from './EmailTemplateManager';
import { AdminEmailTester } from './AdminEmailTester';
import { EmailTestLogs } from './EmailTestLogs';
import { EmailAutomationRules } from './EmailAutomationRules';
import { 
  Mail, 
  TestTube, 
  FileText, 
  History, 
  Zap,
  BarChart3 
} from 'lucide-react';

export const EmailNotificationSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notification Management System
          </CardTitle>
          <CardDescription>
            Comprehensive email template management, testing, and automation for fleet operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="tester" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Test Center
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Test Logs
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Automation
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <EmailTemplateManager />
            </TabsContent>

            <TabsContent value="tester" className="space-y-4">
              <AdminEmailTester />
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <EmailTestLogs />
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <EmailAutomationRules />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Email Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Advanced email performance analytics and reporting coming soon
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
