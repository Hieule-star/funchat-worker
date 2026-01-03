-- Set REPLICA IDENTITY FULL for all realtime tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.calls REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.friendships REPLICA IDENTITY FULL;

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" 
ON public.conversation_participants;

-- Create new policy allowing users to view ALL participants in their conversations
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp
    WHERE cp.user_id = auth.uid()
  )
);