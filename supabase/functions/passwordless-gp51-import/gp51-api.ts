
import { GP51Vehicle } from './types.ts';

export async function getMonitorListForUser(username: string, token: string): Promise<GP51Vehicle[]> {
  console.log(`Fetching vehicle list for ${username}...`);

  // Standardized GP51 API endpoint with token as URL parameter
  const response = await fetch(`https://www.gps51.com/webapi?action=querymonitorlist&token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ 
      username
    })
  });

  if (!response.ok) {
    console.error(`GP51 monitor list HTTP error: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch monitor list: HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log(`GP51 monitor list response for ${username}:`, JSON.stringify(result, null, 2));
  
  // Standardized success check - GP51 uses status: 0 for success
  if (result.status === 0) {
    const monitors = result.records || result.monitors || result.data?.monitors || result.devices || [];
    console.log(`Found ${monitors.length} vehicles for ${username}`);
    return monitors;
  }
  
  const errorMessage = result.cause || result.message || result.error || 'Unknown error';
  console.error(`Failed to get monitor list for ${username}: ${errorMessage}`);
  throw new Error(`Failed to get monitor list for ${username}: ${errorMessage}`);
}

export async function enrichWithPositions(vehicles: GP51Vehicle[], token: string): Promise<GP51Vehicle[]> {
  if (!vehicles.length) return vehicles;

  const deviceIds = vehicles.map(v => v.deviceid);
  console.log(`Fetching positions for ${deviceIds.length} vehicles...`);

  try {
    // Standardized GP51 API endpoint with token as URL parameter
    const response = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        deviceids: deviceIds,
        lastquerypositiontime: 0
      })
    });

    if (!response.ok) {
      console.warn(`GP51 positions HTTP error: ${response.status} ${response.statusText}`);
      return vehicles; // Return vehicles without positions rather than failing
    }

    const result = await response.json();
    console.log('GP51 positions response received');
    
    // Standardized success check - GP51 uses status: 0 for success
    if (result.status === 0 && result.positions) {
      const positionMap = new Map();
      result.positions.forEach((pos: any) => {
        positionMap.set(pos.deviceid, pos);
      });

      return vehicles.map(vehicle => ({
        ...vehicle,
        lastPosition: positionMap.get(vehicle.deviceid) || null
      }));
    }
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    // Don't fail the entire import for position errors
  }

  return vehicles;
}
