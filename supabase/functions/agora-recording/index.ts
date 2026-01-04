import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecordingRequest {
  action: 'acquire' | 'start' | 'stop' | 'query';
  channelName: string;
  uid?: number;
  resourceId?: string;
  sid?: string;
  mode?: 'video' | 'audio';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID');
    const AGORA_CUSTOMER_ID = Deno.env.get('AGORA_CUSTOMER_ID');
    const AGORA_CUSTOMER_SECRET = Deno.env.get('AGORA_CUSTOMER_SECRET');
    const R2_ACCESS_KEY_ID = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME');
    const R2_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_R2_ACCOUNT_ID');

    if (!AGORA_APP_ID || !AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      console.error('[Recording] Missing Agora credentials');
      throw new Error('Missing Agora credentials');
    }

    const body: RecordingRequest = await req.json();
    const { action, channelName, uid, resourceId, sid, mode = 'video' } = body;

    console.log('[Recording] Action:', action, 'Channel:', channelName, 'UID:', uid);

    // Create Authorization header (Base64 encoded)
    const credentials = btoa(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`);
    const authHeader = `Basic ${credentials}`;

    const baseUrl = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording`;

    if (action === 'acquire') {
      // Step 1: Acquire a resource ID
      const recordingUid = uid || Math.floor(Math.random() * 100000) + 100000;
      
      const acquireResponse = await fetch(`${baseUrl}/acquire`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cname: channelName,
          uid: String(recordingUid),
          clientRequest: {
            resourceExpiredHour: 24,
            scene: 0, // 0 = composite recording
          },
        }),
      });

      const acquireData = await acquireResponse.json();
      console.log('[Recording] Acquire response:', acquireData);

      if (!acquireResponse.ok) {
        throw new Error(`Acquire failed: ${JSON.stringify(acquireData)}`);
      }

      return new Response(JSON.stringify({
        resourceId: acquireData.resourceId,
        uid: recordingUid,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'start') {
      if (!resourceId || !uid) {
        throw new Error('resourceId and uid are required for start action');
      }

      // Storage config for Cloudflare R2 (S3-compatible)
      const storageConfig = R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME ? {
        vendor: 1, // 1 = S3-compatible
        region: 0, // 0 for S3-compatible storage
        bucket: R2_BUCKET_NAME,
        accessKey: R2_ACCESS_KEY_ID,
        secretKey: R2_SECRET_ACCESS_KEY,
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        fileNamePrefix: ['recordings', channelName],
      } : null;

      const recordingConfig = mode === 'video' ? {
        maxIdleTime: 30,
        streamTypes: 2, // 0 = audio, 1 = video, 2 = both
        audioProfile: 1, // 1 = high quality
        channelType: 0, // 0 = communication, 1 = live broadcast
        videoStreamType: 0, // 0 = high quality
        transcodingConfig: {
          width: 1280,
          height: 720,
          fps: 30,
          bitrate: 1500,
          mixedVideoLayout: 1, // 1 = Best fit layout
          backgroundColor: '#000000',
        },
        subscribeVideoUids: ['#allstream#'],
        subscribeAudioUids: ['#allstream#'],
      } : {
        maxIdleTime: 30,
        streamTypes: 0, // 0 = audio only
        audioProfile: 2, // 2 = high quality stereo
        channelType: 0,
        subscribeAudioUids: ['#allstream#'],
      };

      const startBody: any = {
        cname: channelName,
        uid: String(uid),
        clientRequest: {
          recordingConfig,
          recordingFileConfig: {
            avFileType: ['hls', 'mp4'],
          },
        },
      };

      // Add storage config if available
      if (storageConfig) {
        startBody.clientRequest.storageConfig = storageConfig;
      }

      console.log('[Recording] Starting recording with config:', JSON.stringify(startBody, null, 2));

      const startResponse = await fetch(`${baseUrl}/resourceid/${resourceId}/mode/mix/start`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(startBody),
      });

      const startData = await startResponse.json();
      console.log('[Recording] Start response:', startData);

      if (!startResponse.ok) {
        throw new Error(`Start failed: ${JSON.stringify(startData)}`);
      }

      return new Response(JSON.stringify({
        sid: startData.sid,
        resourceId: startData.resourceId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'stop') {
      if (!resourceId || !sid || !uid) {
        throw new Error('resourceId, sid, and uid are required for stop action');
      }

      const stopResponse = await fetch(`${baseUrl}/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cname: channelName,
          uid: String(uid),
          clientRequest: {},
        }),
      });

      const stopData = await stopResponse.json();
      console.log('[Recording] Stop response:', stopData);

      if (!stopResponse.ok) {
        throw new Error(`Stop failed: ${JSON.stringify(stopData)}`);
      }

      return new Response(JSON.stringify({
        serverResponse: stopData.serverResponse,
        resourceId: stopData.resourceId,
        sid: stopData.sid,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'query') {
      if (!resourceId || !sid) {
        throw new Error('resourceId and sid are required for query action');
      }

      const queryResponse = await fetch(`${baseUrl}/resourceid/${resourceId}/sid/${sid}/mode/mix/query`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      });

      const queryData = await queryResponse.json();
      console.log('[Recording] Query response:', queryData);

      return new Response(JSON.stringify(queryData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('[Recording] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
