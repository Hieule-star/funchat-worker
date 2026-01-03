-- Create storage bucket for wallpapers
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for wallpapers bucket
CREATE POLICY "Users can view all wallpapers"
ON storage.objects FOR SELECT
USING (bucket_id = 'wallpapers');

CREATE POLICY "Users can upload their own wallpapers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own wallpapers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own wallpapers"
ON storage.objects FOR DELETE
USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);