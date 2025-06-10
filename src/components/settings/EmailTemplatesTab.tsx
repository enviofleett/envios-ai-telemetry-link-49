
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  id?: string;
  user_id?: string;
  template_name: string;
  template_type: string;
  subject: string;
  body_text: string;
  body_html?: string;
  variables: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const TEMPLATE_TYPES = [
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'notification', label: 'Notification' },
  { value: 'alert', label: 'Alert' },
  { value: 'report', label: 'Report' },
  { value: 'maintenance', label: 'Maintenance Reminder' },
  { value: 'custom', label: 'Custom' },
];

const EmailTemplatesTab: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert the database response to our interface format
      const convertedTemplates: EmailTemplate[] = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      }));
      
      setTemplates(convertedTemplates);
    } catch (error: any) {
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate({
      template_name: '',
      template_type: 'custom',
      subject: '',
      body_text: '',
      variables: [],
      is_active: true,
    });
    setIsEditing(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare the data for database insertion
      const templateData = {
        ...selectedTemplate,
        user_id: user.id,
        variables: selectedTemplate.variables as any // Convert to Json type for database
      };

      const { error } = await supabase
        .from('email_templates')
        .upsert(templateData);

      if (error) throw error;

      toast({
        title: "Template Saved",
        description: "Email template has been saved successfully.",
      });

      setIsEditing(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully.",
      });

      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const updateVariables = () => {
    if (selectedTemplate) {
      const subjectVars = extractVariables(selectedTemplate.subject);
      const bodyVars = extractVariables(selectedTemplate.body_text);
      const allVars = [...new Set([...subjectVars, ...bodyVars])];
      setSelectedTemplate({ ...selectedTemplate, variables: allVars });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Create and manage email templates for automated communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Template
          </Button>
        </CardContent>
      </Card>

      {!isEditing && (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{template.template_name}</h3>
                    <p className="text-sm text-muted-foreground">{template.template_type}</p>
                    <p className="text-sm text-muted-foreground">Subject: {template.subject}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isEditing && selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTemplate.id ? 'Edit Template' : 'Create New Template'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={selectedTemplate.template_name}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    template_name: e.target.value
                  })}
                  placeholder="Welcome Email"
                />
              </div>
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
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={selectedTemplate.subject}
                onChange={(e) => {
                  setSelectedTemplate({
                    ...selectedTemplate,
                    subject: e.target.value
                  });
                  updateVariables();
                }}
                placeholder="Welcome to {{company_name}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={selectedTemplate.body_text}
                onChange={(e) => {
                  setSelectedTemplate({
                    ...selectedTemplate,
                    body_text: e.target.value
                  });
                  updateVariables();
                }}
                placeholder="Hello {{user_name}}, welcome to our platform..."
                rows={10}
              />
            </div>

            {selectedTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailTemplatesTab;
