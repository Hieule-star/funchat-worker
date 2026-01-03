-- Add is_recalled column to messages table
ALTER TABLE public.messages 
ADD COLUMN is_recalled boolean NOT NULL DEFAULT false;

-- Add recalled_at timestamp
ALTER TABLE public.messages 
ADD COLUMN recalled_at timestamp with time zone DEFAULT null;