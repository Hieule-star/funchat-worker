import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

interface Env {
  AGORA_APP_ID: string;
  AGORA_APP_CERTIFICATE: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  CORS_ORIGIN: string;
}

interface TokenRequest {
  channelName: string;
  uid?: number;
  role?: 'publisher' | 'subscriber';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': getCorsOrigin(request, env.CORS_ORIGIN),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    try {
      // Validate Supabase JWT
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        console.log('[Agora Worker] Missing or invalid Authorization header');
        return jsonResponse({ error: 'Missing or invalid Authorization header' }, 401, corsHeaders);
      }

      const token = authHeader.slice(7);
      const isValidUser = await validateSupabaseToken(token, env);
      if (!isValidUser) {
        console.log('[Agora Worker] Invalid or expired Supabase token');
        return jsonResponse({ error: 'Invalid or expired token' }, 401, corsHeaders);
      }

      // Parse request body
      const body = await request.json() as TokenRequest;
      const { channelName, uid = 0, role = 'publisher' } = body;

      if (!channelName || typeof channelName !== 'string') {
        console.log('[Agora Worker] Missing or invalid channelName');
        return jsonResponse({ error: 'Missing or invalid channelName' }, 400, corsHeaders);
      }

      // Validate Agora credentials
      if (!env.AGORA_APP_ID || !env.AGORA_APP_CERTIFICATE) {
        console.error('[Agora Worker] Missing Agora credentials');
        return jsonResponse({ error: 'Server configuration error' }, 500, corsHeaders);
      }

      // Generate Agora token
      const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
      const expiresIn = 3600; // 1 hour
      const currentTs = Math.floor(Date.now() / 1000);
      const expireTs = currentTs + expiresIn;

      const agoraToken = RtcTokenBuilder.buildTokenWithUid(
        env.AGORA_APP_ID,
        env.AGORA_APP_CERTIFICATE,
        channelName.trim(),
        uid,
        rtcRole,
        expireTs
      );

      console.log('[Agora Worker] Token generated for channel:', channelName);

      return jsonResponse({
        token: agoraToken,
        appId: env.AGORA_APP_ID,
        expireAt: expireTs,
      }, 200, corsHeaders);

    } catch (error) {
      console.error('[Agora Worker] Error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
    }
  },
};

async function validateSupabaseToken(token: string, env: Env): Promise<boolean> {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('[Agora Worker] Supabase validation error:', error);
    return false;
  }
}

function getCorsOrigin(request: Request, allowedOrigins: string): string {
  const origin = request.headers.get('Origin') || '';
  const origins = allowedOrigins.split(',').map(o => o.trim());
  return origins.includes(origin) ? origin : origins[0];
}

function jsonResponse(data: object, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
