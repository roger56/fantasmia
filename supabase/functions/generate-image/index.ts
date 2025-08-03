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

    // Smart word replacement instead of removal
    const wordReplacements = {
      'morto': 'addormentato',
      'morte': 'riposo eterno', 
      'uccide': 'sconfigge',
      'ammazza': 'ferma',
      'sangue': 'energia rossa',
      'violenza': 'azione dinamica',
      'arma': 'strumento',
      'coltello': 'utensile',
      'pistola': 'dispositivo',
      'guerra': 'grande sfida',
      'battaglia': 'competizione',
      'combattimento': 'confronto'
    }

    // Clean and improve prompt
    let cleanPrompt = prompt
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Replace problematic words with safer alternatives
    Object.entries(wordReplacements).forEach(([bad, good]) => {
      const regex = new RegExp(`\\b${bad}\\b`, 'gi')
      cleanPrompt = cleanPrompt.replace(regex, good)
    })

    // Limit length for safety
    cleanPrompt = cleanPrompt.substring(0, 600)
    
    console.log('Original prompt:', prompt)
    console.log('Cleaned prompt:', cleanPrompt)

    // Create safe prompt templates based on style
    const createStylePrompt = (content: string, artStyle: string) => {
      const safeTemplates = {
        'fumetto': `Create a family-friendly cartoon illustration showing: ${content}. Use bright cheerful colors, cartoon style, clear outlines. No text, no weapons, no violence.`,
        'fotografico': `Create a beautiful realistic image of: ${content}. Professional photography style, good lighting, peaceful scene. No text, family-friendly content.`,
        'astratto': `Create an abstract artistic interpretation of: ${content}. Use colors, shapes and artistic elements to represent the theme. No text, creative and peaceful.`
      }
      return safeTemplates[artStyle] || `Create a beautiful, family-friendly illustration of: ${content}. No text in image.`
    }

    let enhancedPrompt = createStylePrompt(cleanPrompt, style)
    
    console.log('Enhanced prompt:', enhancedPrompt)

    // Function to attempt image generation with model fallback
    const attemptImageGeneration = async (promptToUse: string, model: string, attempt: number) => {
      console.log(`Attempt ${attempt} with model: ${model}, prompt:`, promptToUse)
      
      const requestBody = model === 'gpt-image-1' 
        ? {
            model: 'gpt-image-1',
            prompt: promptToUse,
            n: 1,
            size: '1024x1024',
            quality: 'high',
            output_format: 'png'
          }
        : {
            model: 'dall-e-3',
            prompt: promptToUse,
            n: 1,
            size: '1024x1024',
            quality: 'hd'
          }

      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      console.log(`OpenAI response status (${model}):`, response.status)
      console.log(`OpenAI response (${model}):`, JSON.stringify(responseData, null, 2))

      if (!response.ok) {
        const errorMessage = responseData.error?.message || 'Failed to generate image'
        console.error(`${model} failed:`, errorMessage)
        throw new Error(errorMessage)
      }

      return { data: responseData, model }
    }

    // 3-level intelligent retry system
    let result
    let usedModel = 'gpt-image-1'
    
    try {
      // Level 1: Try gpt-image-1 with enhanced prompt
      console.log('Level 1: Trying gpt-image-1 with enhanced prompt')
      result = await attemptImageGeneration(enhancedPrompt, 'gpt-image-1', 1)
      usedModel = 'gpt-image-1'
    } catch (error) {
      console.log('Level 1 failed:', error.message)
      
      // Check if it's a verification error for gpt-image-1
      if (error.message?.includes('organization must be verified') || error.message?.includes('gpt-image-1')) {
        console.log('Level 2: gpt-image-1 not available, trying dall-e-3 with same prompt')
        try {
          result = await attemptImageGeneration(enhancedPrompt, 'dall-e-3', 2)
          usedModel = 'dall-e-3'
        } catch (dalleError) {
          console.log('Level 2 failed:', dalleError.message)
          
          // Level 3: Ultra-safe prompt with dall-e-3
          if (dalleError.message?.includes('safety') || dalleError.message?.includes('policy')) {
            console.log('Level 3: Safety issue detected, trying ultra-safe prompt with dall-e-3')
            
            const ultraSafePrompt = style === 'fumetto' 
              ? "A colorful, cheerful cartoon illustration with friendly characters in a peaceful setting, bright colors, family-friendly"
              : style === 'fotografico'
              ? "A beautiful, peaceful landscape photograph with natural lighting, professional photography"
              : "An abstract artistic composition with harmonious colors and shapes, peaceful and creative"
            
            try {
              result = await attemptImageGeneration(ultraSafePrompt, 'dall-e-3', 3)
              usedModel = 'dall-e-3'
            } catch (finalError) {
              console.error('All levels failed:', finalError.message)
              throw finalError
            }
          } else {
            throw dalleError
          }
        }
      } else if (error.message?.includes('safety') || error.message?.includes('policy')) {
        // Level 2: Safety issue with gpt-image-1, try ultra-safe with dall-e-3
        console.log('Level 2: Safety issue with gpt-image-1, trying ultra-safe prompt with dall-e-3')
        
        const ultraSafePrompt = style === 'fumetto' 
          ? "A colorful, cheerful cartoon illustration with friendly characters in a peaceful setting, bright colors, family-friendly"
          : style === 'fotografico'
          ? "A beautiful, peaceful landscape photograph with natural lighting, professional photography"
          : "An abstract artistic composition with harmonious colors and shapes, peaceful and creative"
        
        try {
          result = await attemptImageGeneration(ultraSafePrompt, 'dall-e-3', 2)
          usedModel = 'dall-e-3'
        } catch (finalError) {
          console.error('All levels failed:', finalError.message)
          throw finalError
        }
      } else {
        throw error
      }
    }

    // Extract image URL from result - handle both model response formats
    let imageUrl
    if (result.data && result.data.data && result.data.data[0]) {
      if (result.data.data[0].url) {
        // dall-e-3 returns URL
        imageUrl = result.data.data[0].url
        console.log(`Using ${usedModel} URL response:`, imageUrl)
      } else if (result.data.data[0].b64_json) {
        // gpt-image-1 returns base64
        imageUrl = `data:image/png;base64,${result.data.data[0].b64_json}`
        console.log(`Using ${usedModel} base64 response (length: ${result.data.data[0].b64_json.length})`)
      }
    }

    if (!imageUrl) {
      throw new Error('No image data returned from OpenAI')
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