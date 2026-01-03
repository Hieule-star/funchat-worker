import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WALLPAPER_PRESETS } from '@/lib/wallpaper-presets';

interface WallpaperSettings {
  type: 'gradient' | 'image' | 'pattern' | 'none';
  value: string | null;
  pattern?: string;
}

const STORAGE_KEY = 'chat_wallpaper_';

export function useWallpaper(conversationId?: string) {
  const { user } = useAuth();
  const [wallpaper, setWallpaper] = useState<WallpaperSettings>({ type: 'gradient', value: 'hsl(var(--wa-chat-bg))' });
  const [loading, setLoading] = useState(true);

  // Load wallpaper from localStorage first, then from database
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Try localStorage first for instant loading
    const cacheKey = STORAGE_KEY + (conversationId || 'global') + '_' + user.id;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setWallpaper(parsed);
      } catch (e) {
        console.error('Failed to parse cached wallpaper:', e);
      }
    }

    // Then fetch from database
    const fetchWallpaper = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_wallpapers')
          .select('wallpaper_type, wallpaper_value')
          .eq('user_id', user.id)
          .eq('conversation_id', conversationId || null as any)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const settings: WallpaperSettings = {
            type: data.wallpaper_type as 'gradient' | 'image' | 'none',
            value: data.wallpaper_value
          };
          setWallpaper(settings);
          localStorage.setItem(cacheKey, JSON.stringify(settings));
        }
      } catch (error) {
        console.error('Error fetching wallpaper:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallpaper();
  }, [user?.id, conversationId]);

  const updateWallpaper = useCallback(async (type: 'gradient' | 'image' | 'pattern' | 'none', value: string | null, pattern?: string) => {
    if (!user?.id) return;

    const cacheKey = STORAGE_KEY + (conversationId || 'global') + '_' + user.id;
    const newSettings: WallpaperSettings = { type, value, pattern };
    
    // Update state and cache immediately
    setWallpaper(newSettings);
    localStorage.setItem(cacheKey, JSON.stringify(newSettings));

    try {
      // For pattern type, store both gradient and pattern in value as JSON
      const storedValue = type === 'pattern' && pattern 
        ? JSON.stringify({ gradient: value, pattern })
        : value;

      // Check if record exists
      const { data: existing } = await supabase
        .from('chat_wallpapers')
        .select('id')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId || null as any)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from('chat_wallpapers')
          .update({
            wallpaper_type: type,
            wallpaper_value: storedValue
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('chat_wallpapers')
          .insert({
            user_id: user.id,
            conversation_id: conversationId || null,
            wallpaper_type: type,
            wallpaper_value: storedValue
          });
      }
    } catch (error) {
      console.error('Error saving wallpaper:', error);
    }
  }, [user?.id, conversationId]);

  const getWallpaperStyle = useCallback((): React.CSSProperties => {
    if (wallpaper.type === 'none' || !wallpaper.value) {
      return { backgroundColor: 'hsl(var(--background))' };
    }
    
    if (wallpaper.type === 'image') {
      return {
        backgroundImage: `url(${wallpaper.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    if (wallpaper.type === 'pattern' && wallpaper.pattern) {
      return {
        backgroundImage: `url("${wallpaper.pattern}"), ${wallpaper.value}`,
        backgroundSize: 'auto, cover',
        backgroundRepeat: 'repeat, no-repeat'
      };
    }
    
    // Gradient
    if (wallpaper.value.startsWith('linear-gradient')) {
      return { background: wallpaper.value };
    }
    
    return { backgroundColor: wallpaper.value };
  }, [wallpaper]);

  return {
    wallpaper,
    loading,
    updateWallpaper,
    getWallpaperStyle,
    presets: WALLPAPER_PRESETS
  };
}
