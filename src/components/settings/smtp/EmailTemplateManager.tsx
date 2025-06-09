
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Edit, Save, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body_html: string;
  body_text: string;
  is_active: boolean;
  placeholders: string[];
}

const EmailTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    createDefaultTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;
      
      // Transform the data to match our interface, handling the Json type for placeholders
      const transformedTemplates = (data || []).map((template: any) => ({
        ...template,
        placeholders: Array.isArray(template.placeholders) 
          ? template.placeholders 
          : template.placeholders 
            ? JSON.parse(template.placeholders as string)
            : []
      }));
      
      setTemplates(transformedTemplates);
    } catch (error) {
      console.error('Failed to load email templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplates = async () => {
    try {
      // Check if OTP template exists
      const { data: existingOtp } = await supabase
        .from('email_templates')
        .select('id')
        .eq('template_type', 'otp')
        .single();

      if (!existingOtp) {
        await supabase
          .from('email_templates')
          .insert({
            template_type: 'otp',
            subject: 'Your Verification Code - {{otp_type}}',
            body_html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Verification Code</h2>
                <p>Hello {{user_name}},</p>
                <p>Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                  {{otp_code}}
                </div>
                <p>This code will expire in {{expiry_minutes}} minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <p>Best regards,<br>Envio Team</p>
              </div>
            `,
            body_text: `
              Hello {{user_name}},
              
              Your verification code is: {{otp_code}}
              
              This code will expire in {{expiry_minutes}} minutes.
              
              If you didn't request this code, please ignore this email.
              
              Best regards,
              Envio Team
            `,
            is_active: true,
            placeholders: ['user_name', 'otp_code', 'expiry_minutes', 'otp_type']
          });
      }

      // Check if welcome template exists
      const { data: existingWelcome } = await supabase
        .from('email_templates')
        .select('id')
        .eq('template_type', 'welcome')
        .single();

      if (!existingWelcome) {
        await supabase
          .from('email_templates')
          .insert({
            template_type: 'welcome',
            subject: 'Welcome to Envio Platform!',
            body_html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Envio!</h2>
                <p>Hello {{user_name}},</p>
                <p>Thank you for joining the Envio Platform. We're excited to have you on board!</p>
                <p>You can now access your dashboard and start managing your fleet efficiently.</p>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The Envio Team</p>
              </div>
            `,
            body_text: `
              Hello {{user_name}},
              
              Thank you for joining the Envio Platform. We're excited to have you on board!
              
              You can now access your dashboard and start managing your fleet efficiently.
              
              If you have any questions, feel free to contact our support team.
              
              Best regards,
              The Envio Team
            `,
            is_active: true,
            placeholders: ['user_name']
          });
      }
    } catch (error) {
      console.error('Failed to create default templates:', error);
    }
  };

  const saveTemplate = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .upsert({
          id: template.id,
          template_type: template.template_type,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          is_active: template.is_active,
          placeholders: template.placeholders
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email template saved successfully"
      });

      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length === 0 ? (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              No email templates found. Default templates will be created automatically.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium capitalize">{template.template_type}</h3>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Subject:</strong> {template.subject}</p>
                  <p><strong>Placeholders:</strong> {template.placeholders.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Edit {editingTemplate.template_type} Template
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTemplate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      subject: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="html-content">HTML Content</Label>
                  <Textarea
                    id="html-content"
                    rows={10}
                    value={editingTemplate.body_html}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      body_html: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="text-content">Text Content</Label>
                  <Textarea
                    id="text-content"
                    rows={6}
                    value={editingTemplate.body_text}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      body_text: e.target.value
                    })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => saveTemplate(editingTemplate)}>
                    <Save className="h-3 w-3 mr-1" />
                    Save Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailTemplateManager;
