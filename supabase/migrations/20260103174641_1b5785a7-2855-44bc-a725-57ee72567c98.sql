-- Add is_edited column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false;

-- Create message_edits table to store edit history
CREATE TABLE public.message_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  original_content TEXT,
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_by UUID NOT NULL
);

-- Enable RLS on message_edits
ALTER TABLE public.message_edits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view edit history of messages in their conversations
CREATE POLICY "Users can view edit history in their conversations"
ON public.message_edits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_edits.message_id AND cp.user_id = auth.uid()
  )
);

-- Policy: Users can insert edit history for their own messages
CREATE POLICY "Users can insert edit history for their messages"
ON public.message_edits
FOR INSERT
WITH CHECK (
  auth.uid() = edited_by AND
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_edits.message_id AND m.sender_id = auth.uid()
  )
);

-- Enable realtime for message_edits
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_edits;