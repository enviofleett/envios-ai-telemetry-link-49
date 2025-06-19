
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData } from '@/types/vehicle';

interface VehiclePosition {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  timestamp: string;
  raw_data?: any;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export const useWebSocketVehicleData = (vehicleIds: string[] = []) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [latestPositions, setLatestPositions] = useState<Map<string, VehiclePosition>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const { toast } = useToast();

  const getWebSocketUrl = useCallback(() => {
    const supabaseUrl = 'https://bjkqxmvjuewshomihjqm.supabase.co';
    return `${supabaseUrl.replace('https://', 'wss://')}/functions/v1/realtime-vehicle-websocket`;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 Sent WebSocket message:', message);
    } else {
      console.warn('⚠️ Cannot send message - WebSocket not connected');
    }
  }, []);

  const authenticate = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        sendMessage({
          type: 'authenticate',
          token: session.access_token
        });
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError('Failed to authenticate WebSocket connection');
    }
  }, [sendMessage]);

  const subscribeToVehicles = useCallback(() => {
    if (vehicleIds.length > 0) {
      sendMessage({
        type: 'subscribe_vehicles',
        vehicleIds
      });
    }
  }, [vehicleIds, sendMessage]);

  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = setInterval(() => {
      sendMessage({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }, 30000); // Ping every 30 seconds
  }, [sendMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 WebSocket already connected');
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        setError(null);
        reconnectAttempts.current = 0;
        
        // Authenticate and subscribe
        authenticate();
        startPing();
        
        toast({
          title: "Real-time Connection Established",
          description: "Live vehicle tracking is now active",
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Received WebSocket message:', message);
          
          switch (message.type) {
            case 'connection_established':
              console.log('🎯 Connection established:', message.connectionId);
              break;
              
            case 'authenticated':
              console.log('🔐 Authentication successful');
              subscribeToVehicles();
              break;
              
            case 'live_position_update':
              if (message.position) {
                setLatestPositions(prev => {
                  const newMap = new Map(prev);
                  newMap.set(message.position.device_id, message.position);
                  return newMap;
                });
              }
              break;
              
            case 'position_update':
              if (message.positions && Array.isArray(message.positions)) {
                setLatestPositions(prev => {
                  const newMap = new Map(prev);
                  message.positions.forEach((pos: VehiclePosition) => {
                    newMap.set(pos.device_id, pos);
                  });
                  return newMap;
                });
              }
              break;
              
            case 'pong':
              // Pong received, connection is alive
              break;
              
            case 'error':
              console.error('❌ WebSocket error:', message.message);
              setError(message.message);
              break;
              
            default:
              console.log('❓ Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionState('error');
          setError('Failed to establish real-time connection after multiple attempts');
          toast({
            title: "Connection Failed",
            description: "Unable to establish real-time connection. Using fallback polling.",
            variant: "destructive",
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionState('error');
        setError('WebSocket connection error');
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionState('error');
      setError('Failed to create WebSocket connection');
    }
  }, [getWebSocketUrl, authenticate, subscribeToVehicles, startPing, toast]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
    setError(null);
  }, []);

  const requestPositionUpdate = useCallback(() => {
    sendMessage({
      type: 'request_position_update',
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  // Effect for connecting/disconnecting based on vehicleIds
  useEffect(() => {
    if (vehicleIds.length > 0) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [vehicleIds.length > 0]); // Only depend on whether we have vehicles, not the specific IDs

  // Effect for updating subscription when vehicle IDs change
  useEffect(() => {
    if (isConnected && vehicleIds.length > 0) {
      subscribeToVehicles();
    }
  }, [vehicleIds, isConnected, subscribeToVehicles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionState,
    latestPositions,
    error,
    connect,
    disconnect,
    requestPositionUpdate,
    sendMessage
  };
};
