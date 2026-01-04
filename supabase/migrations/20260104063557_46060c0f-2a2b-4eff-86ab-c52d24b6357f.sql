-- Add recording_url column to calls table to store recording links
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS recording_url text;

-- Add duration column to store call duration in seconds
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS duration integer;