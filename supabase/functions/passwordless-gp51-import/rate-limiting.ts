
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@0.4.4';
import { Redis } from 'https://esm.sh/@upstash/redis@1.28.4';

export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 s"),
  analytics: true,
  prefix: "passwordless-import",
});
