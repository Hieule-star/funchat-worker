import { CUTE_PATTERNS, PatternKey } from './wallpaper-patterns';

export interface WallpaperPreset {
  id: string;
  name: string;
  type: 'gradient' | 'pattern' | 'none';
  value: string | null;
  emoji: string;
  pattern?: string;
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
  // Pattern wallpapers (Telegram style)
  {
    id: 'unicorn-dreams',
    name: 'Unicorn Dreams',
    type: 'pattern',
    value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #c9b1ff 100%)',
    pattern: CUTE_PATTERNS.unicorn,
    emoji: '🦄'
  },
  {
    id: 'bunny-garden',
    name: 'Bunny Garden',
    type: 'pattern',
    value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    pattern: CUTE_PATTERNS.bunny,
    emoji: '🐰'
  },
  {
    id: 'starry-magic',
    name: 'Starry Magic',
    type: 'pattern',
    value: 'linear-gradient(135deg, #2c3e50 0%, #4a69bd 50%, #6a89cc 100%)',
    pattern: CUTE_PATTERNS.stars,
    emoji: '⭐'
  },
  {
    id: 'crystal-fantasy',
    name: 'Crystal Fantasy',
    type: 'pattern',
    value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    pattern: CUTE_PATTERNS.crystal,
    emoji: '💎'
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    type: 'pattern',
    value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)',
    pattern: CUTE_PATTERNS.cherry,
    emoji: '🌸'
  },
  {
    id: 'kitty-world',
    name: 'Kitty World',
    type: 'pattern',
    value: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 50%, #fd79a8 100%)',
    pattern: CUTE_PATTERNS.kitty,
    emoji: '🐱'
  },
  {
    id: 'rainbow-clouds',
    name: 'Rainbow Clouds',
    type: 'pattern',
    value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 30%, #d4fc79 60%, #ffecd2 100%)',
    pattern: CUTE_PATTERNS.rainbow,
    emoji: '🌈'
  },
  {
    id: 'sweet-hearts',
    name: 'Sweet Hearts',
    type: 'pattern',
    value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    pattern: CUTE_PATTERNS.hearts,
    emoji: '💕'
  },
  // Solid gradients
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
