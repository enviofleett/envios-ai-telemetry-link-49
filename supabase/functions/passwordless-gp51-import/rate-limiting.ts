
import { RateLimit, InMemoryStore } from 'https://esm.sh/@upstash/ratelimit@0.4.4';

export const rateLimit = new RateLimit({
  store: new InMemoryStore(),
  prefix: "passwordless-import",
  policy: "10 r/s",
  headers: {
    remaining: 'RateLimit-Remaining',
    limit: 'RateLimit-Limit',
    reset: 'RateLimit-Reset'
  }
});
