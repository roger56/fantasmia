-- Fix security issue: Users can view other users' media generation costs
-- Update the SELECT policy to restrict users to only view their own media generation records

DROP POLICY IF EXISTS "Only authenticated users can view media generations" ON public.media_generations;

CREATE POLICY "Users can only view their own media generations" 
ON public.media_generations 
FOR SELECT 
USING (auth.uid() = user_id);