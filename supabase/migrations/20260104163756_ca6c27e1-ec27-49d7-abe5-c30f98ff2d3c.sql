-- Create archived_conversations table
CREATE TABLE public.archived_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.archived_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their archived conversations"
  ON public.archived_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can archive their conversations"
  ON public.archived_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unarchive their conversations"
  ON public.archived_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_archived_conversations_user_id ON public.archived_conversations(user_id);
CREATE INDEX idx_archived_conversations_conversation_id ON public.archived_conversations(conversation_id);