
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GP51UnifiedClient } from '../_shared/gp51_api_client_fixed.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log(`📊 [gp51-historical-data] Starting request processing...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`🔄 [gp51-historical-data] Processing action: ${action}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get GP51 credentials
    const username = Deno.env.get('GP51_ADMIN_USERNAME') || 'octopus';
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!password) {
      throw new Error('GP51_ADMIN_PASSWORD not found in environment');
    }

    const client = new GP51UnifiedClient(username, password);

    switch (action) {
      case 'get_device_tracks': {
        const { deviceId, beginTime, endTime, timezone = 8 } = params;
        
        if (!deviceId || !beginTime || !endTime) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters: deviceId, beginTime, endTime'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`🛣️ [gp51-historical-data] Getting tracks for device: ${deviceId}`);
        
        const result = await client.queryTracks(deviceId, beginTime, endTime, timezone);
        
        if (result.status === 0) {
          return new Response(JSON.stringify({
            success: true,
            data: {
              deviceId,
              timeRange: { beginTime, endTime, timezone },
              tracks: result.records || [],
              totalPoints: result.records?.length || 0,
            },
            message: `Retrieved ${result.records?.length || 0} track points`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          throw new Error(result.cause || 'Failed to get device tracks');
        }
      }

      case 'get_device_trips': {
        const { deviceId, beginTime, endTime, timezone = 8 } = params;
        
        if (!deviceId || !beginTime || !endTime) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters: deviceId, beginTime, endTime'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`🚗 [gp51-historical-data] Getting trips for device: ${deviceId}`);
        
        const result = await client.queryTrips(deviceId, beginTime, endTime, timezone);
        
        if (result.status === 0) {
          // Calculate summary statistics
          const trips = result.trips || [];
          const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
          const totalDuration = trips.reduce((sum, trip) => sum + (trip.duration || 0), 0);
          const maxSpeed = Math.max(...trips.map(trip => trip.maxspeed || 0), 0);
          const avgSpeed = trips.length > 0 ? trips.reduce((sum, trip) => sum + (trip.avgspeed || 0), 0) / trips.length : 0;

          return new Response(JSON.stringify({
            success: true,
            data: {
              deviceId,
              timeRange: { beginTime, endTime, timezone },
              trips: trips,
              summary: {
                totalTrips: trips.length,
                totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
                totalDuration: Math.round(totalDuration * 100) / 100,
                maxSpeed: Math.round(maxSpeed * 100) / 100,
                avgSpeed: Math.round(avgSpeed * 100) / 100,
              }
            },
            message: `Retrieved ${trips.length} trips with ${Math.round(totalDistance)} total distance`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          throw new Error(result.cause || 'Failed to get device trips');
        }
      }

      case 'get_multi_device_data': {
        const { deviceIds, beginTime, endTime, timezone = 8, includeTrips = false } = params;
        
        if (!deviceIds || !Array.isArray(deviceIds) || !beginTime || !endTime) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters: deviceIds (array), beginTime, endTime'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`📊 [gp51-historical-data] Getting data for ${deviceIds.length} devices`);
        
        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const deviceId of deviceIds) {
          try {
            console.log(`🔄 Processing device: ${deviceId}`);
            
            // Get tracks for this device
            const tracksResult = await client.queryTracks(deviceId, beginTime, endTime, timezone);
            
            const deviceData: any = {
              deviceId,
              success: tracksResult.status === 0,
              tracks: tracksResult.status === 0 ? tracksResult.records || [] : [],
              trackCount: tracksResult.status === 0 ? tracksResult.records?.length || 0 : 0,
            };

            // Optionally get trips data
            if (includeTrips && tracksResult.status === 0) {
              const tripsResult = await client.queryTrips(deviceId, beginTime, endTime, timezone);
              if (tripsResult.status === 0) {
                deviceData.trips = tripsResult.trips || [];
                deviceData.tripCount = tripsResult.trips?.length || 0;
              }
            }

            if (deviceData.success) {
              successCount++;
            } else {
              errorCount++;
              deviceData.error = tracksResult.cause || 'Failed to get data';
            }

            results.push(deviceData);
            
          } catch (error) {
            errorCount++;
            results.push({
              deviceId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              tracks: [],
              trackCount: 0,
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            timeRange: { beginTime, endTime, timezone },
            devices: results,
            summary: {
              totalDevices: deviceIds.length,
              successfulDevices: successCount,
              failedDevices: errorCount,
              totalTrackPoints: results.reduce((sum, device) => sum + device.trackCount, 0),
              ...(includeTrips && {
                totalTrips: results.reduce((sum, device) => sum + (device.tripCount || 0), 0)
              })
            }
          },
          message: `Processed ${deviceIds.length} devices: ${successCount} successful, ${errorCount} failed`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'export_historical_data': {
        const { deviceIds, beginTime, endTime, timezone = 8, format = 'json' } = params;
        
        if (!deviceIds || !Array.isArray(deviceIds) || !beginTime || !endTime) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters: deviceIds (array), beginTime, endTime'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`📤 [gp51-historical-data] Exporting historical data for ${deviceIds.length} devices`);
        
        const exportData = [];
        
        for (const deviceId of deviceIds) {
          try {
            const tracksResult = await client.queryTracks(deviceId, beginTime, endTime, timezone);
            const tripsResult = await client.queryTrips(deviceId, beginTime, endTime, timezone);
            
            const deviceExport = {
              deviceId,
              timeRange: { beginTime, endTime, timezone },
              tracks: tracksResult.status === 0 ? tracksResult.records || [] : [],
              trips: tripsResult.status === 0 ? tripsResult.trips || [] : [],
              trackCount: tracksResult.status === 0 ? tracksResult.records?.length || 0 : 0,
              tripCount: tripsResult.status === 0 ? tripsResult.trips?.length || 0 : 0,
              success: tracksResult.status === 0 && tripsResult.status === 0,
            };
            
            exportData.push(deviceExport);
            
          } catch (error) {
            exportData.push({
              deviceId,
              error: error instanceof Error ? error.message : 'Export failed',
              success: false,
            });
          }
        }

        const totalTracks = exportData.reduce((sum, device) => sum + (device.trackCount || 0), 0);
        const totalTrips = exportData.reduce((sum, device) => sum + (device.tripCount || 0), 0);

        return new Response(JSON.stringify({
          success: true,
          data: {
            exportInfo: {
              exportTimestamp: new Date().toISOString(),
              format,
              timeRange: { beginTime, endTime, timezone },
            },
            devices: exportData,
            summary: {
              totalDevices: deviceIds.length,
              totalTracks: totalTracks,
              totalTrips: totalTrips,
            }
          },
          message: `Historical data exported: ${totalTracks} tracks, ${totalTrips} trips from ${deviceIds.length} devices`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        console.error(`❌ Unknown action: ${action}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ [gp51-historical-data] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
    status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
