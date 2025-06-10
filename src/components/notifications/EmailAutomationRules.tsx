
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Settings,
  Clock,
  Target,
  Filter
} from 'lucide-react';

export const EmailAutomationRules: React.FC = () => {
  // Mock data for automation rules
  const automationRules = [
    {
      id: '1',
      rule_name: 'Vehicle Offline Alert',
      trigger_event: 'vehicle_offline',
      template_name: 'Vehicle Offline Alert',
      is_active: true,
      delay_minutes: 0,
      conditions: { offline_duration: '>5min' },
      recipient_logic: { role: 'fleet_manager' }
    },
    {
      id: '2',
      rule_name: 'Maintenance Due Reminder',
      trigger_event: 'maintenance_due',
      template_name: 'Maintenance Due Reminder',
      is_active: true,
      delay_minutes: 0,
      conditions: { days_before_due: '<=7' },
      recipient_logic: { role: 'maintenance_manager' }
    },
    {
      id: '3',
      rule_name: 'Speed Violation Immediate Alert',
      trigger_event: 'speed_violation',
      template_name: 'Speed Violation Alert',
      is_active: false,
      delay_minutes: 0,
      conditions: { speed_over_limit: '>20%' },
      recipient_logic: { role: 'fleet_supervisor' }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Automation Rules</h3>
          <p className="text-sm text-muted-foreground">
            Configure automatic email triggers for fleet events
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{automationRules.length}</p>
                <p className="text-xs text-muted-foreground">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {automationRules.filter(r => r.is_active).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Triggered Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Rules
          </CardTitle>
          <CardDescription>
            Manage email automation rules for fleet events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationRules.map(rule => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {rule.rule_name}
                      {rule.is_active ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Paused</Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Trigger: {rule.trigger_event.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={rule.is_active ? 'text-red-600' : 'text-green-600'}
                    >
                      {rule.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Template</p>
                    <p>{rule.template_name}</p>
                  </div>

                  <div>
                    <p className="font-medium text-muted-foreground">Conditions</p>
                    <div className="flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      <span className="text-xs">
                        {Object.entries(rule.conditions).map(([key, value]) => 
                          `${key}: ${value}`
                        ).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium text-muted-foreground">Recipients</p>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span className="text-xs">
                        {Object.entries(rule.recipient_logic).map(([key, value]) => 
                          `${key}: ${value}`
                        ).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {rule.delay_minutes > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Delayed by {rule.delay_minutes} minutes</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Rule Templates</CardTitle>
          <CardDescription>
            Start with pre-configured automation rules for common fleet scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Emergency Alerts</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Immediate notifications for panic button, accidents, and critical events
              </p>
              <Button variant="outline" size="sm">Setup Emergency Rules</Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Maintenance Automation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Automated reminders for due maintenance, inspections, and service intervals
              </p>
              <Button variant="outline" size="sm">Setup Maintenance Rules</Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Operational Alerts</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Notifications for route deviations, geofence violations, and operational issues
              </p>
              <Button variant="outline" size="sm">Setup Operational Rules</Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Daily Reports</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Scheduled daily, weekly, and monthly fleet performance reports
              </p>
              <Button variant="outline" size="sm">Setup Reporting Rules</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
