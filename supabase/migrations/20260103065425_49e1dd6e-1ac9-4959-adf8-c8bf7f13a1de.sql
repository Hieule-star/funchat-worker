-- Drop policies with infinite recursion
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;

-- Create fixed policy for conversation_participants (no recursion)
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants FOR SELECT
USING (user_id = auth.uid());

-- Create fixed policies for conversations using subquery
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update conversations they participate in" 
ON public.conversations FOR UPDATE
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);