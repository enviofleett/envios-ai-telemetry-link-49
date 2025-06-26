import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';
import type { VehicleEvent } from '@/services/EnhancedVehicleDataService';

export const VehicleEventNotifications: React.FC = () => {
  const { events, acknowledgeEvent } = useEnhancedVehicleData();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const handleAcknowledge = async (eventId: string) => {
    await acknowledgeEvent(eventId);
  };

  const getEventIcon = (type: string, severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Bell className="h-4 w-4 text-orange-600" />;
      case 'low':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getEventBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
      default:
        return 'secondary';
    }
  };

  const unacknowledgedEvents = events.filter(event => !event.isAcknowledged);
  const acknowledgedEvents = events.filter(event => event.isAcknowledged);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Vehicle Events
            {unacknowledgedEvents.length > 0 && (
              <Badge variant="destructive">
                {unacknowledgedEvents.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No events to display</p>
            <p className="text-xs">Vehicle events will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Unacknowledged Events */}
            {unacknowledgedEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 border border-red-200 bg-red-50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getEventIcon(event.type, event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                        <Badge variant={getEventBadgeVariant(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {event.message}
                      </p>
                      <div className="text-xs text-gray-500">
                        {event.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAcknowledge(event.id)}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Acknowledge
                  </Button>
                </div>
              </div>
            ))}

            {/* Acknowledged Events */}
            {acknowledgedEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 border border-gray-200 bg-gray-50 rounded-lg opacity-60"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                      <Badge variant="outline" className="opacity-60">
                        Acknowledged
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {event.message}
                    </p>
                    <div className="text-xs text-gray-500">
                      {event.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
