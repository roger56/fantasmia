-- Add username column to profiles for login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Create unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username);

-- Update profiles to have usernames based on names (for existing users)
UPDATE public.profiles SET username = LOWER(REPLACE(name, ' ', '')) WHERE username IS NULL;

-- Make email nullable in profiles
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Update the handle_new_user function to support username-based signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, age, user_type, style_preference, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Utente'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, NULL),
    'user',
    'default',
    COALESCE(NEW.raw_user_meta_data->>'username', LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', 'utente'), ' ', '')))
  );
  
  -- Assign user role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Create superuser profile manually
INSERT INTO public.profiles (user_id, name, email, user_type, username)
SELECT auth.uid(), 'superuser', 'superuser@example.com', 'admin', 'superuser'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = 'superuser');

-- Create a function to handle username-based authentication
CREATE OR REPLACE FUNCTION public.authenticate_user(username_input text, password_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  user_record record;
  auth_result json;
BEGIN
  -- For prototype: password must equal username (case insensitive)
  IF LOWER(username_input) != LOWER(password_input) AND username_input != 'superuser' THEN
    RETURN json_build_object('success', false, 'error', 'Password deve essere uguale allo username');
  END IF;
  
  -- Special case for superuser
  IF username_input = 'superuser' AND password_input != 'ssss' THEN
    RETURN json_build_object('success', false, 'error', 'Password non corretta per superuser');
  END IF;
  
  -- Find user by username
  SELECT p.*, u.email as auth_email INTO user_record
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE LOWER(p.username) = LOWER(username_input);
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Username non trovato');
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'user_id', user_record.user_id,
    'username', user_record.username,
    'name', user_record.name,
    'email', user_record.auth_email
  );
END;
$function$;