
import { serve } from 'std/server';
import { cors } from './cors.ts';
import { rateLimit } from './rate-limiting.ts';
import { handlePasswordlessImportRequest } from './main-handler.ts';

const corsHandler = cors({
  allowOrigin: '*',
  allowHeaders: '*',
  allowMethods: ['POST', 'OPTIONS'],
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return corsHandler.handle(req);
  }

  const { success, limit, reset, remaining } = await rateLimit.limit(req.ip);
  console.log('Rate Limit Info:', { success, limit, reset, remaining });

  if (!success) {
    const res = new Response("Rate limit exceeded", { status: 429 });
    res.headers.set("RateLimit-Limit", limit.toString());
    res.headers.set("RateLimit-Remaining", remaining.toString());
    res.headers.set("RateLimit-Reset", reset.toString());
    return corsHandler.addCorsHeaders(res);
  }

  // Handle passwordless import requests
  if (req.method === 'POST' && req.url.includes('/passwordless-gp51-import')) {
    return handlePasswordlessImportRequest(req);
  }

  // Respond with a 404 for any other request
  return corsHandler.addCorsHeaders(new Response('Not Found', { status: 404 }));
});
