import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { prompt, style, storyId, storyTitle, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('🎨 Generating image:', { storyId, style, promptLength: prompt?.length });

    // Truncate prompt if too long (max 500 chars for story content)
    let processedPrompt = prompt;
    if (prompt && prompt.length > 500) {
      processedPrompt = prompt.substring(0, 500) + '...';
      console.log('📝 Prompt truncated from', prompt.length, 'to', processedPrompt.length, 'characters');
    }

    // Style-specific prompts
    const stylePrompts = {
      fumetto: 'cartoon style, colorful comic book illustration',
      fotografico: 'photographic style, realistic photography',
      astratto: 'abstract art style, artistic interpretation',
      manga: 'manga style, anime Japanese illustration',
      acquarello: 'watercolor painting style, soft artistic brushstrokes',
      carboncino: 'charcoal drawing style, black and white sketch'
    };

    const stylePrompt = stylePrompts[style as keyof typeof stylePrompts] || 'artistic illustration';
    
    // Final prompt construction - ALWAYS include "no text" instruction
    const finalPrompt = `Create a ${stylePrompt} based on this story: ${processedPrompt}. IMPORTANT: Do not include any text, letters, or writing in the image. Focus only on visual elements, characters, and scenes.`;

    console.log('🎯 Final prompt:', { 
      style, 
      finalPromptLength: finalPrompt.length,
      truncated: processedPrompt !== prompt 
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: finalPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('🎨 AI response received:', { hasChoices: !!data.choices, choicesLength: data.choices?.length });

    if (!data.choices || !data.choices[0] || !data.choices[0].message?.images) {
      console.error('❌ Unexpected AI response format:', data);
      throw new Error('Invalid response format from AI service');
    }

    const imageUrl = data.choices[0].message.images[0].image_url.url;
    
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log('✅ Image generated successfully:', { 
      storyId, 
      style,
      imageFormat: imageUrl.startsWith('data:') ? 'base64' : 'url',
      size: imageUrl.length 
    });

    return new Response(
      JSON.stringify({ 
        imageUrl,
        style,
        storyId,
        truncated: processedPrompt !== prompt
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
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