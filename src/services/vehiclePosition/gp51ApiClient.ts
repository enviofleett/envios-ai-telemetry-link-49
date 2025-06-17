
const GP51_API_BASE = 'https://api.gps51.com';

export class GP51ApiClient {
  async fetchPositions(deviceIds: string[], token: string): Promise<any[]> {
    const positionPayload = {
      deviceids: deviceIds,
      lastquerypositiontime: ""
    };

    const response = await fetch(`${GP51_API_BASE}/webapi?action=lastposition&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(positionPayload),
    });

    if (!response.ok) {
      throw new Error(`GP51 API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status !== 0) {
      throw new Error(`GP51 API error: ${result.cause || 'Unknown error'}`);
    }

    return result.records || [];
  }
}
