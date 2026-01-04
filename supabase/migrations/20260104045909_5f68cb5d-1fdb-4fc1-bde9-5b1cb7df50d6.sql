-- Drop and recreate remove_group_member function with fixed syntax (no LIMIT in UPDATE)
DROP FUNCTION IF EXISTS public.remove_group_member(uuid, uuid);

CREATE OR REPLACE FUNCTION public.remove_group_member(
  _conversation_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_self_leave boolean;
  admin_count integer;
  next_admin_id uuid;
BEGIN
  is_self_leave := _user_id = auth.uid();

  -- Check if caller is admin or leaving themselves
  IF NOT is_self_leave AND NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can remove members';
  END IF;

  -- Count admins
  SELECT COUNT(*) INTO admin_count
  FROM public.conversation_participants
  WHERE conversation_id = _conversation_id
    AND role = 'admin';

  -- If removing an admin and they're the last one, promote another member
  IF EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
      AND role = 'admin'
  ) AND admin_count = 1 THEN
    -- Find the first member to promote
    SELECT cp.user_id INTO next_admin_id
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id != _user_id
      AND cp.role = 'member'
    LIMIT 1;

    -- Promote them if found
    IF next_admin_id IS NOT NULL THEN
      UPDATE public.conversation_participants
      SET role = 'admin'
      WHERE conversation_id = _conversation_id
        AND user_id = next_admin_id;
    END IF;
  END IF;

  -- Remove the member
  DELETE FROM public.conversation_participants
  WHERE conversation_id = _conversation_id
    AND user_id = _user_id;

  RETURN true;
END;
$$;