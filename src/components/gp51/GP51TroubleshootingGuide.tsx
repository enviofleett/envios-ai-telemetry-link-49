
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wifi,
  Key,
  Database,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface TroubleshootingItem {
  id: string;
  title: string;
  description: string;
  category: 'connection' | 'authentication' | 'data' | 'configuration';
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
  solutions: string[];
  testSteps: string[];
  icon: React.ReactNode;
}

const troubleshootingItems: TroubleshootingItem[] = [
  {
    id: 'connection-failed',
    title: 'Cannot Connect to GP51 API',
    description: 'The application cannot establish a connection to the GP51 API server',
    category: 'connection',
    severity: 'high',
    symptoms: [
      'Connection timeout errors',
      'Network unreachable messages',
      'HTTP 500/502/503 errors from GP51',
      'DNS resolution failures'
    ],
    solutions: [
      'Verify your internet connection is stable',
      'Check if GP51 API URL is correct (default: https://www.gps51.com)',
      'Try using the legacy URL: https://www.gps51.com',
      'Contact your network administrator about firewall rules',
      'Wait a few minutes and try again (GP51 servers may be busy)'
    ],
    testSteps: [
      'Open GP51 Credentials form',
      'Click "Test Connection" button',
      'Check browser developer console for network errors',
      'Try accessing GP51 website directly in browser'
    ],
    icon: <Wifi className="h-4 w-4" />
  },
  {
    id: 'invalid-credentials',
    title: 'Invalid Username or Password',
    description: 'GP51 authentication is failing with provided credentials',
    category: 'authentication',
    severity: 'high',
    symptoms: [
      'Authentication failed error messages',
      'HTTP 401 Unauthorized responses',
      'Invalid login credentials warnings',
      'Session creation failures'
    ],
    solutions: [
      'Double-check your GP51 username (case-sensitive)',
      'Verify your GP51 password is correct',
      'Remove any extra spaces from credentials',
      'Try logging into GP51 website directly to verify credentials',
      'Contact your GP51 administrator for account verification',
      'Reset your GP51 password if necessary'
    ],
    testSteps: [
      'Visit https://www.gps51.com and try manual login',
      'Verify credentials work on GP51 website',
      'Copy credentials exactly from working login',
      'Test connection in Admin Settings'
    ],
    icon: <Key className="h-4 w-4" />
  },
  {
    id: 'session-expired',
    title: 'Session Keeps Expiring',
    description: 'GP51 sessions are expiring frequently or unexpectedly',
    category: 'authentication',
    severity: 'medium',
    symptoms: [
      'Frequent re-authentication prompts',
      'Session expired error messages',
      'Data sync interruptions',
      'Intermittent connection losses'
    ],
    solutions: [
      'Check if your GP51 account has session time limits',
      'Ensure only one application is using GP51 credentials',
      'Contact GP51 support about session duration settings',
      'Save credentials again to refresh session parameters',
      'Monitor session expiration times in Admin Settings'
    ],
    testSteps: [
      'Go to Admin Settings > GP51 Integration',
      'Check session expiration time',
      'Monitor connection status over time',
      'Run health check to verify session validity'
    ],
    icon: <RefreshCw className="h-4 w-4" />
  },
  {
    id: 'no-vehicle-data',
    title: 'No Vehicle Data Syncing',
    description: 'Vehicles are not appearing or data is not updating',
    category: 'data',
    severity: 'medium',
    symptoms: [
      'Empty vehicle list',
      'Outdated position data',
      'No recent sync timestamps',
      'Missing device information'
    ],
    solutions: [
      'Verify your GP51 account has vehicle access permissions',
      'Check if vehicles are active and transmitting',
      'Ensure devices are properly configured in GP51',
      'Force a manual sync in Admin Settings',
      'Contact GP51 support about device permissions',
      'Check vehicle device status in GP51 portal'
    ],
    testSteps: [
      'Login to GP51 website and verify vehicles are visible',
      'Check device status and last communication times',
      'Go to Admin Settings and force sync',
      'Monitor sync logs for error messages'
    ],
    icon: <Database className="h-4 w-4" />
  },
  {
    id: 'api-url-issues',
    title: 'Wrong API URL Configuration',
    description: 'The GP51 API URL is incorrect or has changed',
    category: 'configuration',
    severity: 'medium',
    symptoms: [
      'DNS not found errors',
      'Wrong server responses',
      'Connection to unexpected endpoints',
      'HTTP 404 errors on API calls'
    ],
    solutions: [
      'Use the default URL: https://www.gps51.com',
      'Try the legacy URL if default fails',
      'Remove custom API URL to use system default',
      'Contact GP51 support for current API endpoint',
      'Check GP51 documentation for URL changes'
    ],
    testSteps: [
      'Clear the API URL field to use default',
      'Test connection with empty URL',
      'Try different known GP51 URLs',
      'Check GP51 website for API documentation'
    ],
    icon: <HelpCircle className="h-4 w-4" />
  }
];

export const GP51TroubleshootingGuide: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  const filteredItems = troubleshootingItems.filter(item => 
    filterCategory === 'all' || item.category === filterCategory
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'connection': return <Wifi className="h-4 w-4" />;
      case 'authentication': return <Key className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'configuration': return <HelpCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          GP51 Troubleshooting Guide
        </CardTitle>
        <CardDescription>
          Common issues and step-by-step solutions for GP51 integration problems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
          >
            All Issues
          </Button>
          <Button
            variant={filterCategory === 'connection' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('connection')}
          >
            <Wifi className="h-3 w-3 mr-1" />
            Connection
          </Button>
          <Button
            variant={filterCategory === 'authentication' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('authentication')}
          >
            <Key className="h-3 w-3 mr-1" />
            Authentication
          </Button>
          <Button
            variant={filterCategory === 'data' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('data')}
          >
            <Database className="h-3 w-3 mr-1" />
            Data Sync
          </Button>
          <Button
            variant={filterCategory === 'configuration' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('configuration')}
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Configuration
          </Button>
        </div>

        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Collapsible key={item.id} open={openItems.has(item.id)}>
              <CollapsibleTrigger
                onClick={() => toggleItem(item.id)}
                className="w-full"
              >
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    {openItems.has(item.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {item.icon}
                    <div className="text-left">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(item.severity)}>
                      {item.severity}
                    </Badge>
                    <Badge variant="outline">
                      {getCategoryIcon(item.category)}
                      <span className="ml-1 capitalize">{item.category}</span>
                    </Badge>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 border-l-2 border-blue-200 ml-6 space-y-4">
                  <div>
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Symptoms
                    </h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {item.symptoms.map((symptom, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Solutions
                    </h5>
                    <ol className="text-sm text-muted-foreground space-y-2">
                      {item.solutions.map((solution, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1 font-medium">{index + 1}.</span>
                          {solution}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      Testing Steps
                    </h5>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      {item.testSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1 font-medium">{index + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Still having issues?</strong> If these troubleshooting steps don't resolve your problem, 
            please contact support with the specific error messages and steps you've tried.
            You can also run the validation tests in the Admin Settings to get detailed diagnostic information.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
