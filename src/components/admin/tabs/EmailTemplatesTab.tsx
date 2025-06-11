
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Plus, Edit, Eye, Send, FileText } from 'lucide-react';

const EmailTemplatesTab: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      description: 'Sent to new users after registration',
      status: 'active',
      lastModified: '2024-01-15',
      category: 'user'
    },
    {
      id: 'password-reset',
      name: 'Password Reset',
      description: 'Password reset instructions',
      status: 'active',
      lastModified: '2024-01-10',
      category: 'security'
    },
    {
      id: 'maintenance-reminder',
      name: 'Maintenance Reminder',
      description: 'Vehicle maintenance due notification',
      status: 'active',
      lastModified: '2024-01-08',
      category: 'maintenance'
    },
    {
      id: 'invoice',
      name: 'Invoice Notification',
      description: 'Monthly billing invoice',
      status: 'draft',
      lastModified: '2024-01-05',
      category: 'billing'
    }
  ];

  const categories = ['all', 'user', 'security', 'maintenance', 'billing'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Manage email templates for automated notifications and communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge 
                          variant={template.status === 'active' ? 'default' : 'secondary'}
                        >
                          {template.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last modified: {template.lastModified}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplatesTab;
