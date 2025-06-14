
import React from 'react';
import { useSecurityContext } from '@/components/security/SecurityProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Lock, CheckCircle, ShieldCheck, Users } from 'lucide-react';

export default function SecurityDashboard() {
  const { securityEvents } = useSecurityContext();

  const eventCount = securityEvents.length;
  const criticalEvents = securityEvents.filter(e => e.severity === 'critical');
  const todayEvents = securityEvents.filter(e => {
    const now = new Date();
    const eventDate = new Date(e.timestamp);
    return (
      eventDate.getDate() === now.getDate() &&
      eventDate.getMonth() === now.getMonth() &&
      eventDate.getFullYear() === now.getFullYear()
    );
  });
  const lastCritical = criticalEvents[0];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Healthy Events (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{todayEvents.length}</div>
          <div className="text-xs text-muted-foreground">Total security-related events today</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Critical Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{criticalEvents.length}</div>
          <div className="text-xs text-muted-foreground">
            Most recent: {lastCritical ? new Date(lastCritical.timestamp).toLocaleString() : 'None'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex gap-2"><ShieldCheck className="h-5 w-5 text-blue-500" /> All Events (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{eventCount}</div>
          <div className="text-xs text-muted-foreground">
            Events in the past week (Keep monitoring for trends)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
