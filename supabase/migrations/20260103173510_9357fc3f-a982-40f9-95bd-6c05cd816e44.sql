-- Add is_forwarded column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_forwarded boolean NOT NULL DEFAULT false;