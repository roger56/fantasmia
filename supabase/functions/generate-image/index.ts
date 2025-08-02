import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, style, storyId, storyTitle, userId } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    if (!userId) {
      throw new Error('User ID is required')
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Clean and filter prompt to avoid safety issues
    const cleanPrompt = prompt
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      // Remove potentially problematic words
      .replace(/\b(morto|morte|uccide|ammazza|sangue|violenza|arma|coltello|pistola|guerra|battaglia|combattimento)\b/gi, '')
      .trim()
      .substring(0, 600) // Limit to 600 characters for safety
    
    // Create enhanced prompt based on style - all styles exclude text
    let enhancedPrompt = cleanPrompt
    if (style === 'fumetto') {
      enhancedPrompt = `Comic book style illustration: ${cleanPrompt}. Bright colors, bold outlines, cartoon style, no text in image.`
    } else if (style === 'fotografico') {
      enhancedPrompt = `Professional photograph: ${cleanPrompt}. Realistic lighting, sharp focus, no text.`
    } else if (style === 'astratto') {
      enhancedPrompt = `Abstract art: ${cleanPrompt}. Creative artistic style, no text.`
    }

    console.log('Generating image with prompt:', enhancedPrompt)

    // Generate image using OpenAI DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024', // Standard resolution supported by OpenAI
        quality: 'standard',
        response_format: 'url'
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate image')
    }

    const result = await response.json()
    const imageUrl = result.data[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Use userId from request body (no JWT authentication required)

    // Calculate cost based on size (DALL-E 3 standard quality cost)
    const cost = 0.040 // $0.040 for 1024x1024 for all styles
    
    console.log(`Generated image with style: ${style}, size: 1024x1024, cost: ${cost}`)

    // Save media generation record
    const { data: mediaGeneration, error: mediaError } = await supabase
      .from('media_generations')
      .insert({
        story_id: storyId,
        user_id: userId,
        media_type: 'image',
        media_style: style,
        media_url: imageUrl,
        cost: cost
      })
      .select()
      .maybeSingle()

    if (mediaError) {
      console.error('Error saving media generation:', mediaError)
      // Don't throw error, just log it - we can still return the image
      console.log('Continuing without saving to database...')
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        cost,
        style,
        mediaId: mediaGeneration?.id || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in generate-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})