
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Save, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body_html: string;
  body_text: string;
  placeholders: string[];
  is_active: boolean;
}

const EmailTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      template_type: 'welcome',
      subject: 'Welcome to Envio Platform!',
      body_html: '<h2>Welcome {{userName}}!</h2><p>Thank you for joining the Envio Platform.</p>',
      body_text: 'Welcome {{userName}}! Thank you for joining the Envio Platform.',
      placeholders: ['userName', 'userEmail'],
      is_active: true
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const templateTypes = [
    'welcome',
    'password_reset',
    'otp_verification',
    'vehicle_alert',
    'geofence_alert',
    'maintenance_alert',
    'system_notification'
  ];

  const commonPlaceholders = [
    '{{userName}}',
    '{{userEmail}}',
    '{{vehicleName}}',
    '{{deviceId}}',
    '{{alertType}}',
    '{{location}}',
    '{{timestamp}}',
    '{{geofenceName}}',
    '{{maintenanceType}}',
    '{{dueDate}}'
  ];

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;

    const templateIndex = templates.findIndex(t => t.id === selectedTemplate.id);
    if (templateIndex >= 0) {
      const updatedTemplates = [...templates];
      updatedTemplates[templateIndex] = selectedTemplate;
      setTemplates(updatedTemplates);
    } else {
      setTemplates([...templates, { ...selectedTemplate, id: Date.now().toString() }]);
    }

    setIsEditing(false);
    toast({
      title: "Template Saved",
      description: "Email template has been saved successfully"
    });
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleNewTemplate = () => {
    setSelectedTemplate({
      id: '',
      template_type: 'custom',
      subject: '',
      body_html: '',
      body_text: '',
      placeholders: [],
      is_active: true
    });
    setIsEditing(true);
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!selectedTemplate) return;
    
    setSelectedTemplate({
      ...selectedTemplate,
      body_html: selectedTemplate.body_html + placeholder,
      body_text: selectedTemplate.body_text + placeholder
    });
  };

  const previewTemplate = (template: EmailTemplate) => {
    // Simple preview with sample data
    const sampleData = {
      '{{userName}}': 'John Doe',
      '{{userEmail}}': 'john@example.com',
      '{{vehicleName}}': 'Fleet Vehicle 001',
      '{{deviceId}}': 'DEV001',
      '{{alertType}}': 'Geofence Violation',
      '{{location}}': '40.7128, -74.0060',
      '{{timestamp}}': new Date().toLocaleString(),
      '{{geofenceName}}': 'Downtown Area',
      '{{maintenanceType}}': 'Oil Change',
      '{{dueDate}}': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };

    let previewHtml = template.body_html;
    let previewSubject = template.subject;

    Object.entries(sampleData).forEach(([placeholder, value]) => {
      previewHtml = previewHtml.replace(new RegExp(placeholder, 'g'), value);
      previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), value);
    });

    return { previewHtml, previewSubject };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Template Manager
            </CardTitle>
            <CardDescription>
              Manage email templates for user and vehicle notifications
            </CardDescription>
          </div>
          <Button onClick={handleNewTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.subject}</h4>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Type: {template.template_type}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.placeholders.map((placeholder) => (
                          <Badge key={placeholder} variant="outline" className="text-xs">
                            {placeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6">
            {isEditing && selectedTemplate ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Template Type</Label>
                    <Select 
                      value={selectedTemplate.template_type} 
                      onValueChange={(value) => setSelectedTemplate({
                        ...selectedTemplate,
                        template_type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-subject">Subject</Label>
                    <Input
                      id="template-subject"
                      value={selectedTemplate.subject}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        subject: e.target.value
                      })}
                      placeholder="Email subject line..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Available Placeholders</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonPlaceholders.map((placeholder) => (
                      <Button
                        key={placeholder}
                        variant="outline"
                        size="sm"
                        onClick={() => insertPlaceholder(placeholder)}
                      >
                        {placeholder}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-html">HTML Content</Label>
                  <Textarea
                    id="template-html"
                    value={selectedTemplate.body_html}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      body_html: e.target.value
                    })}
                    placeholder="HTML email content..."
                    rows={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-text">Text Content</Label>
                  <Textarea
                    id="template-text"
                    value={selectedTemplate.body_text}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      body_text: e.target.value
                    })}
                    placeholder="Plain text email content..."
                    rows={6}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveTemplate} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Select a template to edit or create a new one.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Subject: </span>
                      {previewTemplate(selectedTemplate).previewSubject}
                    </div>
                    <div className="border-t pt-2">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: previewTemplate(selectedTemplate).previewHtml 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  Select a template to preview.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateManager;
