-- Create chat_wallpapers table to store user wallpaper preferences
CREATE TABLE public.chat_wallpapers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  wallpaper_type TEXT NOT NULL DEFAULT 'none' CHECK (wallpaper_type IN ('gradient', 'image', 'none')),
  wallpaper_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.chat_wallpapers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wallpapers"
ON public.chat_wallpapers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallpapers"
ON public.chat_wallpapers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallpapers"
ON public.chat_wallpapers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallpapers"
ON public.chat_wallpapers
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_chat_wallpapers_updated_at
BEFORE UPDATE ON public.chat_wallpapers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();