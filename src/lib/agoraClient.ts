import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";

let rtcClient: IAgoraRTCClient | null = null;

/**
 * Singleton pattern for Agora RTC Client
 * Creates a new client if none exists, or returns existing one
 * Note: We create a fresh client each time for clean state management
 */
export function getAgoraClient(): IAgoraRTCClient {
  if (!rtcClient) {
    rtcClient = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });
    console.log("[Agora] Created new RTC client");
  }
  return rtcClient;
}

/**
 * Reset the client - must be called after leaving a channel
 * This ensures the next call gets a fresh client instance
 */
export function resetAgoraClient(): void {
  if (rtcClient) {
    // Remove all event listeners before resetting
    rtcClient.removeAllListeners();
    rtcClient = null;
    console.log("[Agora] Reset RTC client and removed listeners");
  }
}

/**
 * Check if client is currently connected or connecting
 */
export function isAgoraClientConnected(): boolean {
  if (!rtcClient) return false;
  return rtcClient.connectionState === 'CONNECTED' || rtcClient.connectionState === 'CONNECTING';
}
