
import { KvRestApi } from 'https://esm.sh/@upstash/kv@1.0.1';
import { getEnvironment } from './environment.ts';

export async function getUpstashKvClient() {
  const env = getEnvironment();
  return new KvRestApi({
    token: env.UPSTASH_TOKEN,
    url: env.UPSTASH_URL,
  });
}
