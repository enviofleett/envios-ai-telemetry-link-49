
export interface CorsOptions {
  allowOrigin: string;
  allowHeaders: string;
  allowMethods: string[];
}

export function cors(options: CorsOptions) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': options.allowOrigin,
    'Access-Control-Allow-Headers': options.allowHeaders,
    'Access-Control-Allow-Methods': options.allowMethods.join(', '),
  };

  return {
    handle: (req: Request) => {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    },
    addCorsHeaders: (response: Response) => {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    },
  };
}
