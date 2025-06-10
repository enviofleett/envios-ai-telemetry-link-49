
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEnhancedEmailTemplates } from '@/hooks/useEnhancedEmailTemplates';
import { 
  TestTube, 
  Send, 
  Plus, 
  Trash2, 
  RefreshCw,
  Mail,
  Zap,
  Eye
} from 'lucide-react';

export const AdminEmailTester: React.FC = () => {
  const { 
    templates, 
    sendTestEmail, 
    sendBulkTestEmails,
    generateSampleData,
    isTestingEmail,
    isBulkTesting,
    isLoadingTemplates 
  } = useEnhancedEmailTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipientEmails, setRecipientEmails] = useState<string[]>(['']);
  const [testData, setTestData] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);

  // Auto-generate sample data when template changes
  React.useEffect(() => {
    if (selectedTemplateData) {
      const sampleData = generateSampleData(selectedTemplateData);
      setTestData(sampleData);
    }
  }, [selectedTemplateData, generateSampleData]);

  const addRecipientField = () => {
    setRecipientEmails([...recipientEmails, '']);
  };

  const removeRecipientField = (index: number) => {
    setRecipientEmails(recipientEmails.filter((_, i) => i !== index));
  };

  const updateRecipientEmail = (index: number, email: string) => {
    const updated = [...recipientEmails];
    updated[index] = email;
    setRecipientEmails(updated);
  };

  const updateTestDataField = (key: string, value: string) => {
    setTestData(prev => ({ ...prev, [key]: value }));
  };

  const handleSendTest = async () => {
    if (!selectedTemplate) return;
    
    const validEmails = recipientEmails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length === 0) return;

    try {
      await sendTestEmail({
        templateId: selectedTemplate,
        recipientEmails: validEmails,
        testData,
        testType: 'manual'
      });
    } catch (error) {
      console.error('Test email failed:', error);
    }
  };

  const generatePreview = () => {
    if (!selectedTemplateData) return { subject: '', htmlContent: '', textContent: '' };

    let subject = selectedTemplateData.subject;
    let htmlContent = selectedTemplateData.body_html || '';
    let textContent = selectedTemplateData.body_text || '';

    // Replace placeholders with test data
    Object.entries(testData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      subject = subject.replace(regex, value);
      htmlContent = htmlContent.replace(regex, value);
      textContent = textContent.replace(regex, value);
    });

    return { subject, htmlContent, textContent };
  };

  if (isLoadingTemplates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading email tester...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const preview = generatePreview();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Test Center</h3>
          <p className="text-sm text-muted-foreground">
            Test email templates with custom data and multiple recipients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure email template testing parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Selection */}
            <div>
              <Label htmlFor="template">Email Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template to test" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.template_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {template.template_category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Test Recipients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRecipientField}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {recipientEmails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={email}
                      onChange={(e) => updateRecipientEmail(index, e.target.value)}
                    />
                    {recipientEmails.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecipientField(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Test Data Variables */}
            {selectedTemplateData && selectedTemplateData.placeholders.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Template Variables</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sampleData = generateSampleData(selectedTemplateData);
                      setTestData(sampleData);
                    }}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>
                <div className="space-y-3">
                  {selectedTemplateData.placeholders.map(placeholder => (
                    <div key={placeholder}>
                      <Label htmlFor={placeholder} className="text-xs">
                        {`{{${placeholder}}}`}
                      </Label>
                      <Input
                        id={placeholder}
                        value={testData[placeholder] || ''}
                        onChange={(e) => updateTestDataField(placeholder, e.target.value)}
                        placeholder={`Value for ${placeholder}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Send Test Button */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSendTest}
                disabled={!selectedTemplate || isTestingEmail || recipientEmails.filter(e => e.trim()).length === 0}
                className="flex items-center gap-2 flex-1"
              >
                {isTestingEmail ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Preview */}
        {previewMode && selectedTemplateData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Preview
              </CardTitle>
              <CardDescription>
                Live preview of the email with current test data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subject Line</Label>
                <div className="p-3 bg-muted rounded-md text-sm font-medium">
                  {preview.subject}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">HTML Content</Label>
                <div 
                  className="p-4 bg-white border rounded-md text-sm max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview.htmlContent }}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Text Content</Label>
                <Textarea
                  value={preview.textContent}
                  readOnly
                  className="h-32 text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Info */}
        {!previewMode && selectedTemplateData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Template Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedTemplateData.template_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplateData.template_category.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority Level</Label>
                  <Badge variant={selectedTemplateData.priority_level === 'critical' ? 'destructive' : 'default'}>
                    {selectedTemplateData.priority_level}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Variables</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplateData.placeholders.length} placeholder(s)
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Subject Template</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {selectedTemplateData.subject}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Available Variables</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplateData.placeholders.map(placeholder => (
                    <Badge key={placeholder} variant="secondary" className="text-xs">
                      {`{{${placeholder}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
