
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehiclePosition {
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

interface ClientConnection {
  socket: WebSocket;
  userId?: string;
  vehicleFilters: string[];
  lastPing: number;
}

const connections = new Map<string, ClientConnection>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { socket, response } = Deno.upgradeWebSocket(req);
  const connectionId = crypto.randomUUID();
  
  console.log(`🔌 WebSocket connection opened: ${connectionId}`);

  socket.onopen = () => {
    console.log(`✅ WebSocket connection established: ${connectionId}`);
    
    // Send initial connection confirmation
    socket.send(JSON.stringify({
      type: 'connection_established',
      connectionId,
      timestamp: new Date().toISOString()
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log(`📨 Received message:`, message);

      switch (message.type) {
        case 'authenticate':
          await handleAuthentication(message, connectionId, supabase);
          break;
        
        case 'subscribe_vehicles':
          await handleVehicleSubscription(message, connectionId);
          break;
        
        case 'ping':
          handlePing(connectionId);
          break;
        
        case 'request_position_update':
          await handlePositionUpdateRequest(message, connectionId, supabase);
          break;
        
        default:
          console.log(`❓ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`❌ Error processing message:`, error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
        timestamp: new Date().toISOString()
      }));
    }
  };

  socket.onclose = () => {
    console.log(`🔌 WebSocket connection closed: ${connectionId}`);
    connections.delete(connectionId);
    
    // Clean up connection from database
    supabase
      .from('realtime_connections')
      .delete()
      .eq('connection_id', connectionId)
      .then(() => console.log(`🧹 Cleaned up connection: ${connectionId}`));
  };

  socket.onerror = (error) => {
    console.error(`❌ WebSocket error for ${connectionId}:`, error);
  };

  // Initialize connection
  connections.set(connectionId, {
    socket,
    vehicleFilters: [],
    lastPing: Date.now()
  });

  async function handleAuthentication(message: any, connectionId: string, supabase: any) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(message.token);
      
      if (error || !user) {
        socket.send(JSON.stringify({
          type: 'auth_error',
          message: 'Invalid authentication token'
        }));
        return;
      }

      const connection = connections.get(connectionId);
      if (connection) {
        connection.userId = user.id;
        
        // Store connection in database
        await supabase
          .from('realtime_connections')
          .upsert({
            connection_id: connectionId,
            user_id: user.id,
            vehicle_filters: {},
            last_ping: new Date().toISOString()
          });

        socket.send(JSON.stringify({
          type: 'authenticated',
          userId: user.id,
          timestamp: new Date().toISOString()
        }));
        
        console.log(`🔐 User authenticated: ${user.id} for connection: ${connectionId}`);
      }
    } catch (error) {
      console.error(`❌ Authentication error:`, error);
      socket.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
    }
  }

  async function handleVehicleSubscription(message: any, connectionId: string) {
    const connection = connections.get(connectionId);
    if (connection) {
      connection.vehicleFilters = message.vehicleIds || [];
      
      socket.send(JSON.stringify({
        type: 'subscription_updated',
        vehicleFilters: connection.vehicleFilters,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`🚗 Vehicle subscription updated for ${connectionId}:`, connection.vehicleFilters);
    }
  }

  function handlePing(connectionId: string) {
    const connection = connections.get(connectionId);
    if (connection) {
      connection.lastPing = Date.now();
      
      socket.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
    }
  }

  async function handlePositionUpdateRequest(message: any, connectionId: string, supabase: any) {
    try {
      const connection = connections.get(connectionId);
      if (!connection || !connection.userId) {
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Not authenticated'
        }));
        return;
      }

      // Get latest positions for subscribed vehicles
      const { data: positions, error } = await supabase
        .from('vehicle_positions')
        .select(`
          *,
          vehicles!inner(id, device_name, user_id)
        `)
        .in('device_id', connection.vehicleFilters)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error(`❌ Error fetching positions:`, error);
        return;
      }

      // Group by device_id and get latest position for each
      const latestPositions = new Map();
      positions?.forEach(pos => {
        if (!latestPositions.has(pos.device_id) || 
            new Date(pos.timestamp) > new Date(latestPositions.get(pos.device_id).timestamp)) {
          latestPositions.set(pos.device_id, pos);
        }
      });

      socket.send(JSON.stringify({
        type: 'position_update',
        positions: Array.from(latestPositions.values()),
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error(`❌ Error handling position update request:`, error);
    }
  }

  return response;
});

// Broadcast position updates to connected clients
export async function broadcastPositionUpdate(position: VehiclePosition) {
  const message = JSON.stringify({
    type: 'live_position_update',
    position,
    timestamp: new Date().toISOString()
  });

  connections.forEach((connection, connectionId) => {
    if (connection.socket.readyState === WebSocket.OPEN &&
        (connection.vehicleFilters.length === 0 || 
         connection.vehicleFilters.includes(position.device_id))) {
      
      try {
        connection.socket.send(message);
      } catch (error) {
        console.error(`❌ Error sending to connection ${connectionId}:`, error);
        connections.delete(connectionId);
      }
    }
  });
}

// Cleanup inactive connections
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  connections.forEach((connection, connectionId) => {
    if (now - connection.lastPing > timeout) {
      console.log(`🧹 Removing inactive connection: ${connectionId}`);
      try {
        connection.socket.close();
      } catch (error) {
        console.error(`❌ Error closing connection ${connectionId}:`, error);
      }
      connections.delete(connectionId);
    }
  });
}, 60000); // Check every minute
