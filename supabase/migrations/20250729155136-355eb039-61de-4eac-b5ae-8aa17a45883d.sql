-- Phase 1: Critical Database Security Fixes

-- First, update database functions to include proper search_path settings
CREATE OR REPLACE FUNCTION public.is_superuser(user_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = $1 AND user_type = 'SUPERUSER'
  );
$function$;

CREATE OR REPLACE FUNCTION public.create_user_profile(p_user_id text, p_name text, p_age integer, p_user_type user_role, p_style_preference text, p_email text DEFAULT NULL::text, p_avatar text DEFAULT NULL::text, p_password text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    name,
    age,
    email,
    user_type,
    style_preference,
    avatar,
    password
  ) VALUES (
    p_user_id,
    p_name,
    p_age,
    p_email,
    p_user_type,
    p_style_preference,
    p_avatar,
    p_password
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations on stories" ON public.stories;
DROP POLICY IF EXISTS "Allow all operations on admin_messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Allow all operations on suspended_stories" ON public.suspended_stories;

-- Create secure RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Superusers can view all profiles" ON public.user_profiles
FOR SELECT 
USING (public.is_superuser(auth.uid()::text));

CREATE POLICY "Superusers can update all profiles" ON public.user_profiles
FOR UPDATE 
USING (public.is_superuser(auth.uid()::text));

-- Create secure RLS policies for stories
CREATE POLICY "Users can view their own stories" ON public.stories
FOR SELECT 
USING (user_id = auth.uid()::text OR public.is_superuser(auth.uid()::text));

CREATE POLICY "Users can insert their own stories" ON public.stories
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own stories" ON public.stories
FOR UPDATE 
USING (user_id = auth.uid()::text OR public.is_superuser(auth.uid()::text));

CREATE POLICY "Users can delete their own stories" ON public.stories
FOR DELETE 
USING (user_id = auth.uid()::text OR public.is_superuser(auth.uid()::text));

-- Create secure RLS policies for admin_messages
CREATE POLICY "Users can view their own admin messages" ON public.admin_messages
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Superusers can view all admin messages" ON public.admin_messages
FOR SELECT 
USING (public.is_superuser(auth.uid()::text));

CREATE POLICY "Superusers can insert admin messages" ON public.admin_messages
FOR INSERT 
WITH CHECK (public.is_superuser(auth.uid()::text));

CREATE POLICY "Users can update their own admin messages" ON public.admin_messages
FOR UPDATE 
USING (user_id = auth.uid()::text);

-- Create secure RLS policies for suspended_stories
CREATE POLICY "Users can view their own suspended stories" ON public.suspended_stories
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Superusers can view all suspended stories" ON public.suspended_stories
FOR SELECT 
USING (public.is_superuser(auth.uid()::text));

CREATE POLICY "Users can insert their own suspended stories" ON public.suspended_stories
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Superusers can manage all suspended stories" ON public.suspended_stories
FOR ALL 
USING (public.is_superuser(auth.uid()::text));