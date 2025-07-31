-- Create media_generations table for storing AI-generated media records
CREATE TABLE public.media_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id TEXT,
  user_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_style TEXT,
  media_url TEXT NOT NULL,
  cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.media_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for media generations
CREATE POLICY "Users can view their own media generations" 
ON public.media_generations 
FOR SELECT 
USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can create their own media generations" 
ON public.media_generations 
FOR INSERT 
WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Superusers can view all media generations" 
ON public.media_generations 
FOR SELECT 
USING (is_superuser((auth.uid())::text));

CREATE POLICY "Superusers can manage all media generations" 
ON public.media_generations 
FOR ALL 
USING (is_superuser((auth.uid())::text));

-- Create index for better performance
CREATE INDEX idx_media_generations_user_id ON public.media_generations(user_id);
CREATE INDEX idx_media_generations_story_id ON public.media_generations(story_id);