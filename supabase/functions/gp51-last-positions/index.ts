
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] GP51 Last Positions Query`);

    const body = await req.json();
    
    if (!body.token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Step 1: Query Last Positions (from API doc section 4.1)
    const lastPositionUrl = `https://www.gps51.com/webapi?action=lastposition&token=${body.token}`;
    
    console.log('📍 Querying last positions...');

    const requestBody = {
      deviceids: body.deviceIds || [], // Empty array = all devices
      lastquerypositiontime: body.lastQueryTime || 0 // 0 for first time query
    };

    console.log('📤 Request body:', requestBody);

    const gp51Response = await fetch(lastPositionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Envio-Fleet-GP51-Integration/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await gp51Response.text();
    console.log('📍 Position Response:', responseText.substring(0, 500));

    let positionData;
    try {
      positionData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    if (positionData.status !== 0) {
      throw new Error(`GP51 Position API Error: ${positionData.cause}`);
    }

    // Transform position data according to API documentation structure
    const transformedPositions = [];
    
    if (positionData.records && Array.isArray(positionData.records)) {
      positionData.records.forEach(record => {
        const transformedPosition = {
          // Device identification
          deviceId: record.deviceid,
          
          // Position coordinates (calculated values from GP51)
          latitude: record.callat, // Calculated latitude
          longitude: record.callon, // Calculated longitude
          altitude: record.altitude || 0,
          
          // Time information
          deviceTime: record.devicetime, // Device uploaded time
          arrivedTime: record.arrivedtime, // Server received time
          updateTime: record.updatetime, // Last location update after calculation
          validPositionTime: record.validpoistiontime, // Last valid location time
          
          // Movement and navigation
          speed: record.speed || 0, // m/h
          course: record.course || 0, // 0-360 degrees
          isMoving: record.moving === 1,
          
          // Distance and fuel
          totalDistance: record.totaldistance || 0, // meters
          totalOil: record.totaloil || 0,
          masterOil: record.masteroil || 0,
          
          // Status information
          status: record.status, // JT808 protocol status
          statusText: record.strstatus,
          statusTextEn: record.strstatusen,
          
          // Alarms
          alarm: record.alarm,
          alarmText: record.stralarm,
          alarmTextEn: record.stralarmsen,
          
          // Location accuracy and source
          radius: record.radius || 0, // Accuracy radius in meters
          locationSource: record.gotsrc, // gps, wifi, LBS
          
          // Signal and power
          signalLevel: record.rxlevel || 0,
          gpsValidCount: record.gpsvalidnum || 0,
          externalVoltage: record.exvoltage || -1,
          batteryVoltage: record.voltagev || -1,
          batteryPercent: record.voltagepercent || 0,
          
          // Parking information
          parkingLatitude: record.parklat,
          parkingLongitude: record.parklon,
          parkingTime: record.parktime,
          parkingDuration: record.parkduration,
          
          // Environmental sensors
          temperature1: record.temp1,
          temperature2: record.temp2,
          humidity1: record.humi1,
          humidity2: record.humi2,
          
          // Vehicle status
          ioStatus: record.iostatus,
          overspeedState: record.currentoverspeedstate,
          rotateStatus: record.rotatestatus,
          loadStatus: record.loadstatus,
          weight: record.weight,
          
          // Upload mode
          reportMode: record.reportmode,
          
          // Calculated fields for UI
          lastUpdateMinutes: Math.floor((Date.now() - (record.updatetime || 0)) / 60000),
          isOnline: (Date.now() - (record.updatetime || 0)) < 30 * 60 * 1000, // 30 min threshold
          speedKmh: Math.round((record.speed || 0) * 3.6 / 1000), // Convert m/h to km/h
          address: record.address || '' // This might need reverse geocoding
        };
        
        transformedPositions.push(transformedPosition);
      });
    }

    console.log('✅ Positions Transformed:', {
      totalPositions: transformedPositions.length,
      onlineVehicles: transformedPositions.filter(p => p.isOnline).length,
      movingVehicles: transformedPositions.filter(p => p.isMoving).length
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        data: transformedPositions,
        lastQueryTime: positionData.lastquerypositiontime,
        summary: {
          totalPositions: transformedPositions.length,
          onlineVehicles: transformedPositions.filter(p => p.isOnline).length,
          offlineVehicles: transformedPositions.filter(p => !p.isOnline).length,
          movingVehicles: transformedPositions.filter(p => p.isMoving).length,
          stoppedVehicles: transformedPositions.filter(p => !p.isMoving).length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('💥 Position Query Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Position query failed: ${error.message}`,
        data: []
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
