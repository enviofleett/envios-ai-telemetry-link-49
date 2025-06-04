
import { GP51Vehicle } from './types.ts';

export async function getMonitorListForUser(username: string, token: string): Promise<GP51Vehicle[]> {
  console.log(`Fetching vehicle list for ${username}...`);

  const response = await fetch(`https://www.gps51.com/webapi?action=querymonitorlist&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const result = await response.json();
  
  if (result.status !== 'success') {
    throw new Error(`Failed to get monitor list for ${username}: ${result.cause || 'Unknown error'}`);
  }

  console.log(`Found ${result.monitors?.length || 0} vehicles for ${username}`);
  return result.monitors || [];
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
    
    if (result.status === 'success' && result.positions) {
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
