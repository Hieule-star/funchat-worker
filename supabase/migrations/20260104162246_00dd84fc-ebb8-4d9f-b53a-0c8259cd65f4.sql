-- Create table to track soft-deleted conversations per user
CREATE TABLE public.deleted_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.deleted_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their deleted conversations"
  ON public.deleted_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark conversations as deleted"
  ON public.deleted_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can undelete their conversations"
  ON public.deleted_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_deleted_conversations_user_id ON public.deleted_conversations(user_id);
CREATE INDEX idx_deleted_conversations_conversation_id ON public.deleted_conversations(conversation_id);