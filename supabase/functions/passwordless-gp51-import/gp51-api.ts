
import { GP51Vehicle } from './types.ts';

export async function getMonitorListForUser(username: string, token: string): Promise<GP51Vehicle[]> {
  console.log(`Fetching vehicle list for ${username}...`);

  const response = await fetch(`https://www.gps51.com/webapi?action=querymonitorlist&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const result = await response.json();
  console.log(`GP51 monitor list response for ${username}:`, result);
  
  // Handle both success formats from GP51
  if (result.status === 'success' || result.status === 'OK' || result.monitors) {
    const monitors = result.monitors || result.data?.monitors || [];
    console.log(`Found ${monitors.length} vehicles for ${username}`);
    return monitors;
  }
  
  throw new Error(`Failed to get monitor list for ${username}: ${result.cause || result.message || 'Unknown error'}`);
}

export async function enrichWithPositions(vehicles: GP51Vehicle[], token: string): Promise<GP51Vehicle[]> {
  if (!vehicles.length) return vehicles;

  const deviceIds = vehicles.map(v => v.deviceid);
  console.log(`Fetching positions for ${deviceIds.length} vehicles...`);

  try {
    const response = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceids: deviceIds,
        lastquerypositiontime: 0
      })
    });

    const result = await response.json();
    console.log('GP51 positions response:', result);
    
    // Handle both success formats
    if ((result.status === 'success' || result.status === 'OK') && result.positions) {
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
  }

  return vehicles;
}
