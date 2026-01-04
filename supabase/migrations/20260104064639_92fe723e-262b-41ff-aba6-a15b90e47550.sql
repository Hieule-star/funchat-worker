-- Add group_avatar column for group chats
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS group_avatar text;