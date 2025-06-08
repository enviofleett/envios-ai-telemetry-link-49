
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { useSMTPIntegration } from '@/services/smtpIntegrationService';
import { useEnhancedEmailService } from '@/hooks/useEnhancedEmailService';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  RefreshCw,
  Settings,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: "welcome" | "vehicle_activation" | "otp_verification" | "password_reset" | "vehicle_alert" | "geofence_alert";
  content: string;
  variables: string[];
  isActive: boolean;
  lastModified: string;
}

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  type: string;
  status: "sent" | "delivered" | "failed" | "pending";
  sentAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  templateId: string;
}

interface NotificationSettings {
  welcomeEmails: boolean;
  vehicleActivation: boolean;
  otpVerification: boolean;
  passwordReset: boolean;
  vehicleAlerts: boolean;
  geofenceAlerts: boolean;
  systemAlerts: boolean;
  fromEmail: string;
  fromName: string;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "template_welcome",
    name: "Welcome Email",
    subject: "Welcome to Envio Platform - {{userName}}!",
    type: "welcome",
    content: `Dear {{userName}},

Welcome to the Envio Fleet Management Platform!

We're excited to have you on board and look forward to helping you manage your fleet efficiently.

Your account details:
- Email: {{userEmail}}
- Registration Date: {{registrationDate}}
- Account Status: {{accountStatus}}

Get started by logging into your dashboard: {{dashboardUrl}}

If you have any questions, our support team is here to help.

Best regards,
The Envio Team`,
    variables: ["userName", "userEmail", "registrationDate", "accountStatus", "dashboardUrl"],
    isActive: true,
    lastModified: new Date().toISOString().split("T")[0],
  },
  {
    id: "template_vehicle_activation",
    name: "Vehicle Activation",
    subject: "Vehicle Activated Successfully - {{vehicleName}}",
    type: "vehicle_activation",
    content: `Dear {{userName}},

Your vehicle "{{vehicleName}}" (Device ID: {{deviceId}}) has been successfully activated on the Envio platform.

Vehicle Details:
- Vehicle Name: {{vehicleName}}
- Device ID: {{deviceId}}
- Activation Date: {{activationDate}}
- GPS51 Status: {{gps51Status}}

You can now track and manage this vehicle through your Envio dashboard.

Dashboard Link: {{dashboardUrl}}

Best regards,
Envio Fleet Management`,
    variables: ["userName", "vehicleName", "deviceId", "activationDate", "gps51Status", "dashboardUrl"],
    isActive: true,
    lastModified: new Date().toISOString().split("T")[0],
  },
  {
    id: "template_otp",
    name: "OTP Verification",
    subject: "Your Verification Code - {{otpCode}}",
    type: "otp_verification",
    content: `Hello,

Your OTP verification code is: {{otpCode}}

This code will expire in {{expiryMinutes}} minutes.

If you didn't request this code, please ignore this email or contact support.

Best regards,
Envio Platform`,
    variables: ["otpCode", "expiryMinutes"],
    isActive: true,
    lastModified: new Date().toISOString().split("T")[0],
  },
  {
    id: "template_vehicle_alert",
    name: "Vehicle Alert",
    subject: "Vehicle Alert: {{alertType}} - {{vehicleName}}",
    type: "vehicle_alert",
    content: `Alert Notification

Vehicle: {{vehicleName}}
Alert Type: {{alertType}}
Details: {{alertDetails}}
Location: {{location}}
Time: {{alertTime}}

Please take appropriate action if required.

View in Dashboard: {{dashboardUrl}}

Best regards,
Envio Fleet Management`,
    variables: ["vehicleName", "alertType", "alertDetails", "location", "alertTime", "dashboardUrl"],
    isActive: true,
    lastModified: new Date().toISOString().split("T")[0],
  },
];

export function EmailNotificationSystem() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    welcomeEmails: true,
    vehicleActivation: true,
    otpVerification: true,
    passwordReset: true,
    vehicleAlerts: true,
    geofenceAlerts: true,
    systemAlerts: true,
    fromEmail: "noreply@envio.com",
    fromName: "Envio Fleet Management",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { 
    sendEmail, 
    isSMTPConfigured, 
    smtpConfigs 
  } = useSMTPIntegration();
  const { 
    emailLogs: serviceEmailLogs, 
    isLoadingLogs,
    refreshLogs 
  } = useEnhancedEmailService();

  // Load email logs from service
  useEffect(() => {
    if (serviceEmailLogs) {
      const formattedLogs = serviceEmailLogs.map(log => ({
        id: log.id,
        recipient: log.recipient_email,
        subject: log.subject,
        type: log.template_type || 'custom',
        status: log.status as "sent" | "delivered" | "failed" | "pending",
        sentAt: log.sent_at || log.created_at,
        deliveredAt: log.delivered_at,
        errorMessage: log.error_message,
        templateId: log.template_type || 'unknown'
      }));
      setEmailLogs(formattedLogs);
    }
  }, [serviceEmailLogs]);

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      setIsLoading(true);
      
      // Update local templates state
      setTemplates(prev =>
        prev.map(t =>
          t.id === editingTemplate.id
            ? { ...editingTemplate, lastModified: new Date().toISOString().split("T")[0] }
            : t
        )
      );

      toast({
        title: "Template Saved",
        description: "Email template has been updated successfully",
      });

      setShowTemplateEditor(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save email template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate || !testEmailAddress) return;

    try {
      setIsLoading(true);

      if (!(await isSMTPConfigured())) {
        toast({
          title: "SMTP Not Configured",
          description: "Please configure SMTP settings first",
          variant: "destructive"
        });
        return;
      }

      // Replace variables with sample data for testing
      let testContent = selectedTemplate.content;
      let testSubject = selectedTemplate.subject;

      const sampleData: Record<string, string> = {
        userName: "John Doe",
        userEmail: testEmailAddress,
        vehicleName: "Test Vehicle",
        deviceId: "DEV123456",
        otpCode: "123456",
        expiryMinutes: "10",
        alertType: "Speed Alert",
        alertDetails: "Vehicle exceeded speed limit",
        location: "Test Location",
        alertTime: new Date().toLocaleString(),
        registrationDate: new Date().toLocaleDateString(),
        accountStatus: "Active",
        activationDate: new Date().toLocaleDateString(),
        gps51Status: "Connected",
        dashboardUrl: window.location.origin
      };

      // Replace variables in content and subject
      Object.entries(sampleData).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        testContent = testContent.replace(placeholder, value);
        testSubject = testSubject.replace(placeholder, value);
      });

      await sendEmail({
        recipientEmail: testEmailAddress,
        subject: `[TEST] ${testSubject}`,
        htmlContent: testContent.replace(/\n/g, '<br>'),
        textContent: testContent
      });

      toast({
        title: "Test Email Sent",
        description: `Test email sent to ${testEmailAddress}`,
      });

      setShowTestEmail(false);
      setTestEmailAddress("");
      
      // Refresh logs to show the test email
      setTimeout(() => refreshLogs(), 1000);
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTemplate = (templateId: string) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "welcome":
        return "Welcome Email";
      case "vehicle_activation":
        return "Vehicle Activation";
      case "otp_verification":
        return "OTP Verification";
      case "password_reset":
        return "Password Reset";
      case "vehicle_alert":
        return "Vehicle Alert";
      case "geofence_alert":
        return "Geofence Alert";
      default:
        return type;
    }
  };

  const sentEmails = emailLogs.filter(log => log.status === "sent" || log.status === "delivered").length;
  const failedEmails = emailLogs.filter(log => log.status === "failed").length;
  const deliveryRate = emailLogs.length > 0 ? ((sentEmails / emailLogs.length) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Notifications</h2>
          <p className="text-muted-foreground">Manage email templates and notification settings for Envio platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshLogs} disabled={isLoadingLogs}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* SMTP Status Alert */}
      {!smtpConfigs.some(config => config.is_active) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">SMTP Configuration Required</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            No active SMTP configuration found. Email notifications will not work until SMTP is configured.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailLogs.length}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentEmails}</div>
            <p className="text-xs text-muted-foreground">{deliveryRate}% delivery rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedEmails}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.isActive).length}</div>
            <p className="text-xs text-muted-foreground">of {templates.length} total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage automated email templates for fleet management events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getTypeLabel(template.type)}</TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={() => handleToggleTemplate(template.id)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{template.lastModified}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowEmailPreview(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowTestEmail(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Delivery Logs</CardTitle>
              <CardDescription>Track email delivery status and troubleshoot issues</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.recipient}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                      <TableCell>{getTypeLabel(log.type)}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{new Date(log.sentAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>Enable or disable specific notification types for fleet management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Welcome Emails</div>
                    <div className="text-sm text-muted-foreground">Send welcome emails when users register</div>
                  </div>
                  <Switch
                    checked={settings.welcomeEmails}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, welcomeEmails: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Vehicle Activation</div>
                    <div className="text-sm text-muted-foreground">Send notifications when vehicles are activated</div>
                  </div>
                  <Switch
                    checked={settings.vehicleActivation}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, vehicleActivation: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">OTP Verification</div>
                    <div className="text-sm text-muted-foreground">Send OTP codes for verification</div>
                  </div>
                  <Switch
                    checked={settings.otpVerification}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, otpVerification: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Vehicle Alerts</div>
                    <div className="text-sm text-muted-foreground">Send notifications for vehicle alerts and issues</div>
                  </div>
                  <Switch
                    checked={settings.vehicleAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, vehicleAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Geofence Alerts</div>
                    <div className="text-sm text-muted-foreground">Send notifications for geofence violations</div>
                  </div>
                  <Switch
                    checked={settings.geofenceAlerts}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, geofenceAlerts: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {editingTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Email Template</DialogTitle>
                <DialogDescription>Customize the email template content and variables</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Type</Label>
                    <Select
                      value={editingTemplate.type}
                      onValueChange={(value: any) =>
                        setEditingTemplate(prev => prev ? { ...prev, type: value } : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome Email</SelectItem>
                        <SelectItem value="vehicle_activation">Vehicle Activation</SelectItem>
                        <SelectItem value="otp_verification">OTP Verification</SelectItem>
                        <SelectItem value="password_reset">Password Reset</SelectItem>
                        <SelectItem value="vehicle_alert">Vehicle Alert</SelectItem>
                        <SelectItem value="geofence_alert">Geofence Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject Line</Label>
                  <Input
                    id="template-subject"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-content">Email Content</Label>
                  <Textarea
                    id="template-content"
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Available Variables</Label>
                  <div className="flex flex-wrap gap-2">
                    {editingTemplate.variables.map((variable) => (
                      <Badge
                        key={variable}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => {
                          const textarea = document.getElementById("template-content") as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const after = text.substring(end, text.length);
                            const newText = before + `{{${variable}}}` + after;
                            setEditingTemplate(prev => prev ? { ...prev, content: newText } : null);
                          }
                        }}
                      >
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-2xl">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
                <DialogDescription>Preview how the email will look to recipients</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2">Subject:</div>
                  <div className="font-medium">{selectedTemplate.subject}</div>
                </div>

                <div className="p-4 border rounded-lg bg-white">
                  <div className="text-sm text-gray-600 mb-2">Content:</div>
                  <div className="whitespace-pre-wrap text-sm">{selectedTemplate.content}</div>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="text-sm text-blue-600 mb-2">Variables:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEmailPreview(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowEmailPreview(false);
                    setShowTestEmail(true);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestEmail} onOpenChange={setShowTestEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Send a test email to verify the template</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTemplate && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{selectedTemplate.name}</div>
                <div className="text-sm text-muted-foreground">{selectedTemplate.subject}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Test Email Note
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Variables will be replaced with sample data for testing purposes.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTestEmail(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTestEmail} disabled={!testEmailAddress.trim() || isLoading}>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
