-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create index for email search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);

-- Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update handle_new_user function to also sync email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, phone_number, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1),
      NEW.phone
    ),
    NEW.phone,
    NEW.email
  );
  RETURN NEW;
END;
$$;