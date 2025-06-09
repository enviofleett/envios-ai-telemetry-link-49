import { GP51Vehicle } from './types.ts';
import { gp51RateLimiter } from './rate-limiter.ts';

export async function getMonitorListForUser(username: string, token: string, apiUrl?: string): Promise<GP51Vehicle[]> {
  console.log(`Fetching vehicle list for ${username} using API URL: ${apiUrl}...`);

  // Apply rate limiting
  await gp51RateLimiter.acquire();

  try {
    // Use provided API URL or fallback to environment variable or default - ensure complete URL
    let GP51_COMPLETE_API_URL = apiUrl || Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    
    // Ensure the URL includes /webapi
    if (!GP51_COMPLETE_API_URL.includes('/webapi')) {
      GP51_COMPLETE_API_URL = `${GP51_COMPLETE_API_URL}/webapi`;
    }
    
    // Simply append query parameters to the complete API URL
    const apiEndpoint = `${GP51_COMPLETE_API_URL}?action=querymonitorlist&token=${encodeURIComponent(token)}`;

    const response = await fetch(apiEndpoint, {
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
      console.error(`GP51 monitor list HTTP error for ${username}: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch monitor list: HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`GP51 monitor list response for ${username} received from API: ${GP51_COMPLETE_API_URL}`);
    
    // Standardized success check - GP51 uses status: 0 for success
    if (result.status === 0) {
      // Handle different possible response structures
      let monitors = [];
      
      if (result.records) {
        monitors = result.records;
      } else if (result.monitors) {
        monitors = result.monitors;
      } else if (result.data?.monitors) {
        monitors = result.data.monitors;
      } else if (result.devices) {
        monitors = result.devices;
      } else if (result.groups && Array.isArray(result.groups)) {
        // Handle grouped response structure
        monitors = [];
        for (const group of result.groups) {
          if (group.devices && Array.isArray(group.devices)) {
            monitors.push(...group.devices);
          }
        }
      }
      
      console.log(`Found ${monitors.length} vehicles for ${username}`);
      
      // Validate and clean monitor data
      const validMonitors = monitors.filter(monitor => {
        if (!monitor.deviceid) {
          console.warn(`Skipping monitor without deviceid for ${username}:`, monitor);
          return false;
        }
        return true;
      });
      
      if (validMonitors.length !== monitors.length) {
        console.warn(`Filtered out ${monitors.length - validMonitors.length} invalid monitors for ${username}`);
      }
      
      return validMonitors;
    }
    
    const errorMessage = result.cause || result.message || result.error || 'Unknown error';
    console.error(`Failed to get monitor list for ${username}: ${errorMessage}`);
    throw new Error(`Failed to get monitor list for ${username}: ${errorMessage}`);
    
  } catch (error) {
    console.error(`Exception in getMonitorListForUser for ${username}:`, error);
    throw error;
  }
}

export async function enrichWithPositions(vehicles: GP51Vehicle[], token: string, apiUrl?: string): Promise<GP51Vehicle[]> {
  if (!vehicles || vehicles.length === 0) {
    console.log('No vehicles to enrich with positions');
    return vehicles;
  }

  const deviceIds = vehicles.map(v => v.deviceid).filter(id => id);
  console.log(`Fetching positions for ${deviceIds.length} vehicles using API URL: ${apiUrl}...`);

  if (deviceIds.length === 0) {
    console.warn('No valid device IDs found for position enrichment');
    return vehicles;
  }

  // Apply rate limiting
  await gp51RateLimiter.acquire();

  try {
    // Use provided API URL or fallback to environment variable or default - ensure complete URL
    let GP51_COMPLETE_API_URL = apiUrl || Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    
    // Ensure the URL includes /webapi
    if (!GP51_COMPLETE_API_URL.includes('/webapi')) {
      GP51_COMPLETE_API_URL = `${GP51_COMPLETE_API_URL}/webapi`;
    }
    
    // Simply append query parameters to the complete API URL
    const apiEndpoint = `${GP51_COMPLETE_API_URL}?action=lastposition&token=${encodeURIComponent(token)}`;

    const response = await fetch(apiEndpoint, {
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
      console.log('Returning vehicles without position enrichment');
      return vehicles; // Return vehicles without positions rather than failing
    }

    const result = await response.json();
    console.log(`GP51 positions response received from API: ${GP51_COMPLETE_API_URL}`);
    
    // Standardized success check - GP51 uses status: 0 for success
    if (result.status === 0 && result.records) {
      const positionMap = new Map();
      
      // Build position lookup map - note: GP51 uses 'records' not 'positions'
      result.records.forEach((pos: any) => {
        if (pos.deviceid) {
          positionMap.set(pos.deviceid, pos);
        }
      });

      console.log(`Successfully mapped positions for ${positionMap.size} out of ${deviceIds.length} vehicles`);

      // Enrich vehicles with position data
      const enrichedVehicles = vehicles.map(vehicle => ({
        ...vehicle,
        lastPosition: positionMap.get(vehicle.deviceid) || null
      }));

      return enrichedVehicles;
    } else {
      const errorMessage = result.cause || result.message || result.error || 'Position data not available';
      console.warn(`Position enrichment failed: ${errorMessage}`);
      console.log('Returning vehicles without position enrichment');
      return vehicles; // Don't fail the entire import for position errors
    }
    
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    console.log('Returning vehicles without position enrichment due to exception');
    // Don't fail the entire import for position errors
    return vehicles;
  }
}
