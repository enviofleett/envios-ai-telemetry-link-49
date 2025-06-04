
import { getEnvironment } from './environment.ts';

// Simple in-memory cache as fallback if Upstash is not available
const cache = new Map<string, any>();

export async function getUpstashKvClient() {
  const env = getEnvironment();
  
  // If Upstash credentials are not available, use in-memory cache
  if (!env.UPSTASH_TOKEN || !env.UPSTASH_URL) {
    console.log('Upstash credentials not found, using in-memory cache');
    return {
      get: async (key: string) => {
        return cache.get(key) || null;
      },
      set: async (key: string, value: any) => {
        cache.set(key, value);
        return 'OK';
      },
      del: async (key: string) => {
        const existed = cache.has(key);
        cache.delete(key);
        return existed ? 1 : 0;
      }
    };
  }

  // Use fetch-based Upstash REST API client
  return {
    get: async (key: string) => {
      try {
        const response = await fetch(`${env.UPSTASH_URL}/get/${key}`, {
          headers: {
            'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
          },
        });
        
        if (!response.ok) {
          console.error('Upstash GET error:', response.status);
          return null;
        }
        
        const data = await response.json();
        return data.result;
      } catch (error) {
        console.error('Upstash GET failed:', error);
        return null;
      }
    },
    
    set: async (key: string, value: any) => {
      try {
        const response = await fetch(`${env.UPSTASH_URL}/set/${key}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value }),
        });
        
        if (!response.ok) {
          console.error('Upstash SET error:', response.status);
          return 'ERROR';
        }
        
        return 'OK';
      } catch (error) {
        console.error('Upstash SET failed:', error);
        return 'ERROR';
      }
    },
    
    del: async (key: string) => {
      try {
        const response = await fetch(`${env.UPSTASH_URL}/del/${key}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.UPSTASH_TOKEN}`,
          },
        });
        
        if (!response.ok) {
          console.error('Upstash DEL error:', response.status);
          return 0;
        }
        
        const data = await response.json();
        return data.result || 0;
      } catch (error) {
        console.error('Upstash DEL failed:', error);
        return 0;
      }
    }
  };
}
