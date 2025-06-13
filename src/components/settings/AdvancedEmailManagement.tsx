
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Send, 
  BarChart3, 
  Upload, 
  Download,
  Users,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { scheduledCampaignsService, type EmailCampaign } from '@/services/emailCampaigns/scheduledCampaignsService';
import { emailAnalyticsService, type EmailAnalytics } from '@/services/emailAnalytics/emailAnalyticsService';
import { bulkEmailService, type BulkEmailOperation } from '@/services/emailBulk/bulkEmailService';

const AdvancedEmailManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [bulkOperations, setBulkOperations] = useState<BulkEmailOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [campaignsData, analyticsData, bulkOpsData] = await Promise.all([
        scheduledCampaignsService.getCampaigns(),
        emailAnalyticsService.getEmailAnalytics({
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        }),
        bulkEmailService.getBulkOperations()
      ]);

      setCampaigns(campaignsData);
      setAnalytics(analyticsData);
      setBulkOperations(bulkOpsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load email management data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'active':
      case 'processing':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'active':
      case 'processing':
        return 'default';
      case 'paused':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Email Management</h2>
          <p className="text-muted-foreground">
            Manage campaigns, view analytics, and handle bulk operations
          </p>
        </div>
        <Button onClick={loadData} disabled={isLoading}>
          <TrendingUp className="h-4 w-4 mr-2" />
          {isLoading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalEmailsSent.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
                    <Progress value={analytics.successRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed Emails</CardTitle>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalEmailsFailed.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Needs attention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.avgDeliveryTime}s</div>
                    <p className="text-xs text-muted-foreground">
                      Average response time
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Trigger Types</CardTitle>
                    <CardDescription>Most active email triggers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topTriggerTypes.map((trigger, index) => (
                        <div key={trigger.trigger_type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span className="text-sm">{trigger.trigger_type.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{trigger.count}</span>
                            <Badge variant={trigger.success_rate > 90 ? 'default' : 'secondary'}>
                              {trigger.success_rate.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest email deliveries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(activity.status.toLowerCase())}
                            <div>
                              <p className="text-sm font-medium">{activity.recipient_email}</p>
                              <p className="text-xs text-muted-foreground">{activity.subject}</p>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(activity.status.toLowerCase())}>
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Campaigns</h3>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{campaign.campaign_name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {campaign.campaign_type} • {campaign.target_audience}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                      {campaign.scheduled_for && (
                        <span>Scheduled: {new Date(campaign.scheduled_for).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bulk Operations</h3>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              New Bulk Email
            </Button>
          </div>

          <div className="grid gap-4">
            {bulkOperations.map((operation) => (
              <Card key={operation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{operation.operation_name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(operation.status)}>
                      {operation.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {operation.operation_type} • {operation.total_items} items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{operation.processed_items} / {operation.total_items}</span>
                    </div>
                    <Progress 
                      value={(operation.processed_items / operation.total_items) * 100} 
                    />
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-green-600">✓ {operation.successful_items}</span>
                        <span className="text-red-600">✗ {operation.failed_items}</span>
                      </div>
                      <span className="text-muted-foreground">
                        Created: {new Date(operation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Import Recipients</CardTitle>
                <CardDescription>
                  Upload a CSV file to import email recipients for bulk operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> CSV file
                      </p>
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </div>
                    <input type="file" className="hidden" accept=".csv" />
                  </label>
                </div>
                <Button className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Process Import
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Analytics</CardTitle>
                <CardDescription>
                  Download email analytics and delivery reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="date-from">From Date</Label>
                    <Input type="date" id="date-from" />
                  </div>
                  <div>
                    <Label htmlFor="date-to">To Date</Label>
                    <Input type="date" id="date-to" />
                  </div>
                </div>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV Report
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Bulk Email</CardTitle>
              <CardDescription>
                Send a quick email to multiple recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="bulk-subject">Email Subject</Label>
                  <Input id="bulk-subject" placeholder="Enter email subject" />
                </div>
                <div>
                  <Label htmlFor="bulk-recipients">Recipients (comma-separated emails)</Label>
                  <Textarea 
                    id="bulk-recipients" 
                    placeholder="email1@example.com, email2@example.com"
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="bulk-message">Message</Label>
                  <Textarea 
                    id="bulk-message" 
                    placeholder="Enter your message"
                    className="min-h-[150px]"
                  />
                </div>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Bulk Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedEmailManagement;
