
import React, { useState } from 'react';
import { useSecurityContext } from '@/components/security/SecurityProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

export default function SecuritySettingsPanel() {
  const { validateInput, checkRateLimit, hasPermission } = useSecurityContext();
  const { toast } = useToast();

  // Example: local settings for session timeout/rate limiting
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // TODO: Connect to actual configuration if available. Demo state for now.

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Security settings have been updated.",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2"><Lock className="h-4 w-4" /> Authentication Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="block font-medium">Two-Factor Authentication</span>
              <span className="text-sm text-muted-foreground">Require 2FA for all admin accounts</span>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>
          <div>
            <span className="block font-medium mb-1">Session Timeout (minutes)</span>
            <Input
              type="number"
              value={sessionTimeout}
              min={5}
              max={360}
              step={5}
              onChange={e => setSessionTimeout(parseInt(e.target.value || '0'))}
            />
          </div>
          <Button className="mt-4" onClick={handleSave}>Save Authentication Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex gap-2"><Lock className="h-4 w-4" /> Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="block font-medium mb-1">Max Login Attempts</span>
            <Input
              type="number"
              value={maxLoginAttempts}
              min={1}
              max={20}
              step={1}
              onChange={e => setMaxLoginAttempts(parseInt(e.target.value || '0'))}
            />
          </div>
          <div>
            <Switch defaultChecked={true} />
            <span className="ml-2">Enable Audit Logging</span>
          </div>
          <Button className="mt-4" onClick={handleSave}>Save Rate Limit Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
</lov_write>

<lov-write file_path="src/components/admin/tabs/security/SecurityEventsPanel.tsx">
import React, { useState } from 'react';
import { useSecurityContext } from '@/components/security/SecurityProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Key, Lock, Shield } from 'lucide-react';
import EventDetailsDialog from './EventDetailsDialog';

function getEventIcon(type: string) {
  switch (type) {
    case 'authentication':
      return <Key className="h-4 w-4 text-green-600" />;
    case 'input_validation':
      return <Shield className="h-4 w-4 text-blue-600" />;
    case 'rate_limit':
      return <AlertTriangle className="h-4 w-4 text-yellow-700" />;
    case 'authorization':
      return <Lock className="h-4 w-4 text-indigo-600" />;
    case 'suspicious_activity':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical': return <Badge variant="destructive">Critical</Badge>;
    case 'high': return <Badge variant="secondary">High</Badge>;
    case 'medium': return <Badge variant="outline">Medium</Badge>;
    case 'low': return <Badge>Low</Badge>;
    default: return <Badge variant="outline">{severity}</Badge>;
  }
}

interface SecurityEventsPanelProps {
  onViewDetails: (event: any) => void;
}

export default function SecurityEventsPanel({ onViewDetails }: SecurityEventsPanelProps) {
  const { securityEvents } = useSecurityContext();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    if (onViewDetails) onViewDetails(event);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.slice(0, 10).map((event, i) => (
              <div
                className="flex items-center justify-between bg-muted/20 p-3 rounded cursor-pointer hover:bg-muted/30 transition-colors"
                key={i}
                onClick={() => handleViewDetails(event)}
              >
                <div className="flex items-center gap-2">
                  {getEventIcon(event.type)}
                  <span className="text-sm font-medium">{event.type.replace('_', ' ')}</span>
                  <span className="text-xs text-muted-foreground">
                    {event.description}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  {getSeverityBadge(event.severity)}
                  <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {securityEvents.length === 0 && (
              <div className="text-muted-foreground text-center py-6">No security events have been logged in the past 24 hours.</div>
            )}
          </div>
        </CardContent>
      </Card>
      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}
</lov_write>

<lov-write file_path="src/components/admin/tabs/security/EventDetailsDialog.tsx">
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface EventDetailsDialogProps {
  event: any;
  open: boolean;
  onClose: () => void;
}

const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ event, open, onClose }) => {
  if (!event) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Security Event Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Type:</span>
            <span>{event.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Severity:</span>
            <Badge>{event.severity}</Badge>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">Description:</span>
            <span className="text-muted-foreground">{event.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Timestamp:</span>
            <span>{new Date(event.timestamp).toLocaleString()}</span>
          </div>
          {event.userId && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">User ID:</span>
              <span>{event.userId}</span>
            </div>
          )}
          {event.ipAddress && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">IP:</span>
              <span>{event.ipAddress}</span>
            </div>
          )}
          {event.additionalData && (
            <div>
              <span className="font-semibold">Additional Data:</span>
              <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">{JSON.stringify(event.additionalData, null, 2)}</pre>
            </div>
          )}
        </div>
        <DialogFooter>
          <button onClick={onClose} className="btn btn-primary">Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;
</lov_write>

<lov-write file_path="src/components/admin/tabs/security/AccessPoliciesPanel.tsx">
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSecurityContext } from '@/components/security/SecurityProvider';

export default function AccessPoliciesPanel() {
  const { hasPermission } = useSecurityContext();

  // This panel can be extended to manage real access policies (admin, manager, user etc.)
  // For demo, just show current roles and status

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role-Based Access Policies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Admin Panel Access</div>
                <div className="text-sm text-muted-foreground">
                  Only admin users can access this panel.
                </div>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <div className="font-medium">API Access Control</div>
                <div className="text-sm text-muted-foreground">
                  API key authentication required for integrations.
                </div>
              </div>
              <Switch checked disabled />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
</lov_write>

