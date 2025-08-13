-- Enable signups and create superuser
-- First, update auth settings to allow signups (this will be done in Supabase dashboard)

-- Create a superuser in the auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'superuser@example.com',
  crypt('ssss', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "superuser"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Get the superuser ID for role assignment
DO $$
DECLARE
  superuser_id uuid;
BEGIN
  SELECT id INTO superuser_id FROM auth.users WHERE email = 'superuser@example.com';
  
  -- Create profile for superuser
  INSERT INTO public.profiles (user_id, name, email, user_type)
  VALUES (superuser_id, 'superuser', 'superuser@example.com', 'admin')
  ON CONFLICT (user_id) DO UPDATE SET
    name = 'superuser',
    email = 'superuser@example.com',
    user_type = 'admin';
    
  -- Assign admin role to superuser
  INSERT INTO public.user_roles (user_id, role)
  VALUES (superuser_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- Add username column to profiles for login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

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