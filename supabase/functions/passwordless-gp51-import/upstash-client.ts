
import { Redis } from 'https://esm.sh/@upstash/redis@1.28.4';
import { getEnvironment } from './environment.ts';

export async function getUpstashKvClient() {
  const env = getEnvironment();
  return new Redis({
    token: env.UPSTASH_TOKEN,
    url: env.UPSTASH_URL,
  });
}
