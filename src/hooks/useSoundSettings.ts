import { useState, useEffect, useCallback } from "react";

const SOUND_SETTINGS_KEY = "chat_sound_settings";

interface SoundSettings {
  messageNotification: boolean;
}

const defaultSettings: SoundSettings = {
  messageNotification: true,
};

export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    try {
      const stored = localStorage.getItem(SOUND_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleMessageNotification = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      messageNotification: !prev.messageNotification,
    }));
  }, []);

  const setMessageNotification = useCallback((enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      messageNotification: enabled,
    }));
  }, []);

  return {
    messageNotificationEnabled: settings.messageNotification,
    toggleMessageNotification,
    setMessageNotification,
  };
}
