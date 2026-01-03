-- Drop policy cũ (quá restrictive - chỉ cho phép sender update)
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Tạo policy mới cho phép người tham gia conversation có thể update is_read
CREATE POLICY "Users can update messages in their conversations"
ON messages FOR UPDATE
USING (
  sender_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);