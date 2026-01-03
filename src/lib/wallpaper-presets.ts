export interface WallpaperPreset {
  id: string;
  name: string;
  type: 'gradient' | 'none';
  value: string | null;
  emoji: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'none',
    name: 'Không có theme',
    type: 'none',
    value: null,
    emoji: '✕'
  },
  {
    id: 'default',
    name: 'Mặc định',
    type: 'gradient',
    value: 'hsl(var(--wa-chat-bg))',
    emoji: '💬'
  },
  {
    id: 'sunset',
    name: 'Hoàng hôn',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(350, 80%, 50%) 100%)',
    emoji: '🌅'
  },
  {
    id: 'ocean',
    name: 'Đại dương',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(221, 83%, 53%) 0%, hsl(250, 64%, 56%) 100%)',
    emoji: '🌊'
  },
  {
    id: 'forest',
    name: 'Rừng xanh',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(142, 71%, 45%) 0%, hsl(160, 84%, 39%) 100%)',
    emoji: '🌲'
  },
  {
    id: 'lavender',
    name: 'Hoa oải hương',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(270, 60%, 70%) 0%, hsl(290, 60%, 60%) 100%)',
    emoji: '💜'
  },
  {
    id: 'midnight',
    name: 'Đêm khuya',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(230, 35%, 25%) 0%, hsl(220, 45%, 15%) 100%)',
    emoji: '🌙'
  },
  {
    id: 'rose',
    name: 'Hoa hồng',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(340, 82%, 60%) 0%, hsl(320, 70%, 50%) 100%)',
    emoji: '🌸'
  },
  {
    id: 'mint',
    name: 'Bạc hà',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(172, 66%, 50%) 0%, hsl(190, 70%, 45%) 100%)',
    emoji: '💎'
  },
  {
    id: 'gold',
    name: 'Vàng kim',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(45, 93%, 47%) 0%, hsl(36, 100%, 50%) 100%)',
    emoji: '✨'
  },
  {
    id: 'aurora',
    name: 'Cực quang',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(280, 70%, 50%) 0%, hsl(180, 70%, 50%) 50%, hsl(120, 70%, 50%) 100%)',
    emoji: '🌈'
  },
  {
    id: 'coffee',
    name: 'Cà phê',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(25, 35%, 35%) 0%, hsl(20, 30%, 25%) 100%)',
    emoji: '☕'
  },
  {
    id: 'peach',
    name: 'Đào',
    type: 'gradient',
    value: 'linear-gradient(135deg, hsl(15, 90%, 75%) 0%, hsl(340, 80%, 70%) 100%)',
    emoji: '🍑'
  }
];
