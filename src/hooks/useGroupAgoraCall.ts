import { useState, useRef, useCallback, useEffect } from "react";
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser
} from "agora-rtc-sdk-ng";
import { supabase } from "@/integrations/supabase/client";

export interface RemoteUserWithVideo {
  user: IAgoraRTCRemoteUser;
  videoRef: React.RefObject<HTMLDivElement>;
}

interface UseGroupAgoraCallReturn {
  localVideoRef: React.RefObject<HTMLDivElement>;
  joinChannel: (channelName: string, mode: 'video' | 'audio', videoDeviceId?: string, audioDeviceId?: string) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
  isJoined: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  localUid: number | null;
}

export function useGroupAgoraCall(): UseGroupAgoraCallReturn {
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [localUid, setLocalUid] = useState<number | null>(null);
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  const joinChannel = useCallback(async (channelName: string, mode: 'video' | 'audio', videoDeviceId?: string, audioDeviceId?: string) => {
    try {
      console.log('[GroupAgora] Joining channel:', channelName, 'mode:', mode);
      
      // 1. Get token from Cloudflare Worker
      const TOKEN_SERVER = import.meta.env.VITE_AGORA_TOKEN_URL;
      if (!TOKEN_SERVER) {
        throw new Error('VITE_AGORA_TOKEN_URL is not configured');
      }
      
      console.log('[GroupAgora] Fetching token from Cloudflare Worker...');

      // Get Supabase session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const tokenResponse = await fetch(TOKEN_SERVER, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ channelName, uid: 0 }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error('[GroupAgora] Token fetch error:', errorData);
        throw new Error(`Token fetch failed (${tokenResponse.status}): ${errorData.error || 'Unknown error'}`);
      }

      const data = await tokenResponse.json();

      if (!data?.token) {
        throw new Error("Không có token trả về từ server");
      }

      const { token, appId } = data;
      console.log('[GroupAgora] ===== DEBUG INFO =====');
      console.log('[GroupAgora] Channel:', channelName);
      console.log('[GroupAgora] Mode:', mode);
      console.log('[GroupAgora] App ID:', appId);
      console.log('[GroupAgora] Token prefix:', token?.substring(0, 30) + '...');
      console.log('[GroupAgora] ===== END DEBUG =====');

      // 2. Create Agora client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // 3. Setup event handlers for multiple users
      client.on("user-published", async (user, mediaType) => {
        console.log('[GroupAgora] User published:', user.uid, mediaType);
        await client.subscribe(user, mediaType);
        
        if (mediaType === "video") {
          setRemoteUsers(prev => {
            const filtered = prev.filter(u => u.uid !== user.uid);
            return [...filtered, user];
          });
        }
        
        if (mediaType === "audio") {
          user.audioTrack?.play();
          console.log('[GroupAgora] Playing remote audio for user:', user.uid);
          setRemoteUsers(prev => {
            const filtered = prev.filter(u => u.uid !== user.uid);
            return [...filtered, user];
          });
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        console.log('[GroupAgora] User unpublished:', user.uid, mediaType);
        if (mediaType === "video") {
          setRemoteUsers(prev => {
            const idx = prev.findIndex(u => u.uid === user.uid);
            if (idx !== -1) {
              // User still exists but no video
              return [...prev];
            }
            return prev;
          });
        }
      });

      client.on("user-left", (user) => {
        console.log('[GroupAgora] User left:', user.uid);
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      // 4. Join channel - Agora assigns UID
      const uid = await client.join(appId, channelName, token, null);
      console.log('[GroupAgora] Joined channel successfully with UID:', uid);
      setLocalUid(uid as number);

      // 5. Create local tracks based on mode
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack(
        audioDeviceId ? { microphoneId: audioDeviceId } : undefined
      );
      localAudioTrackRef.current = audioTrack;

      const tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [audioTrack];

      // Only create video track if mode is 'video'
      if (mode === 'video') {
        const videoTrack = await AgoraRTC.createCameraVideoTrack(
          videoDeviceId ? { cameraId: videoDeviceId } : undefined
        );
        localVideoTrackRef.current = videoTrack;
        tracksToPublish.push(videoTrack);

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
          console.log('[GroupAgora] Playing local video');
        }
      } else {
        console.log('[GroupAgora] Audio-only mode, skipping video track');
      }

      // Publish tracks
      await client.publish(tracksToPublish);
      console.log('[GroupAgora] Published local tracks:', mode);

      setIsJoined(true);
    } catch (error) {
      console.error('[GroupAgora] Join error:', error);
      throw error;
    }
  }, []);

  const leaveChannel = useCallback(async () => {
    console.log('[GroupAgora] Leaving channel');
    
    // Stop and close local tracks
    localAudioTrackRef.current?.close();
    localVideoTrackRef.current?.close();
    
    // Leave channel
    await clientRef.current?.leave();
    
    // Reset state
    clientRef.current = null;
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    setIsJoined(false);
    setRemoteUsers([]);
    setLocalUid(null);
    
    console.log('[GroupAgora] Left channel successfully');
  }, []);

  const toggleAudio = useCallback((enabled: boolean) => {
    localAudioTrackRef.current?.setEnabled(enabled);
    console.log('[GroupAgora] Audio toggled:', enabled);
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    localVideoTrackRef.current?.setEnabled(enabled);
    console.log('[GroupAgora] Video toggled:', enabled);
  }, []);

  return {
    localVideoRef,
    joinChannel,
    leaveChannel,
    toggleAudio,
    toggleVideo,
    isJoined,
    remoteUsers,
    localUid,
  };
}
