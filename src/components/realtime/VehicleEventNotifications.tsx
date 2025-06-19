
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useRealtimeVehicleData } from '@/hooks/useRealtimeVehicleData';

interface VehicleEventNotificationsProps {
  maxEvents?: number;
  showAcknowledged?: boolean;
}

const VehicleEventNotifications: React.FC<VehicleEventNotificationsProps> = ({
  maxEvents = 10,
  showAcknowledged = false
}) => {
  const { events, acknowledgeEvent } = useRealtimeVehicleData();

  const filteredEvents = events
    .filter(event => showAcknowledged || !event.is_acknowledged)
    .slice(0, maxEvents);

  const getEventIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'secondary';
    }
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Vehicle Events
          {filteredEvents.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {filteredEvents.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent events</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    event.is_acknowledged ? 'bg-muted/50' : 'bg-background'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.event_severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {event.device_id}
                      </span>
                      <Badge 
                        variant={getSeverityColor(event.event_severity)} 
                        className="text-xs"
                      >
                        {event.event_severity}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-1">
                      {event.event_message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatEventTime(event.occurred_at)}
                      </span>
                      
                      {!event.is_acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => acknowledgeEvent(event.id)}
                          className="h-6 px-2 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                    
                    {event.is_acknowledged && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Acknowledged</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleEventNotifications;
