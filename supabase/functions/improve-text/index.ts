import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyContent, style } = await req.json();

    if (!storyContent || !style) {
      return new Response(
        JSON.stringify({ error: 'Missing storyContent or style' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const stylePrompts = {
      'ironico': 'Riscrivi questa storia in stile ironico e divertente, con battute intelligenti e un tono spiritoso. Mantieni massimo 35 righe e formattazione leggibile.',
      'fantasy': 'Trasforma questa storia in un racconto fantasy epico con elementi magici, creature fantastiche e atmosfere incantate. Mantieni massimo 35 righe e formattazione leggibile.',
      'semplice': 'Riscrivi questa storia in modo semplice e leggero, adatto ai bambini, con linguaggio facile e tono dolce. Mantieni massimo 35 righe e formattazione leggibile.',
      'fantasioso': 'Arricchisci questa storia con elementi fantasiosi, creativi e coloriti, rendendola più vivace e immaginativa. Mantieni massimo 35 righe e formattazione leggibile.'
    };

    const systemPrompt = stylePrompts[style as keyof typeof stylePrompts];
    
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: 'Invalid style parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: storyContent
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'OpenAI API request failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const improvedContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ improvedText: improvedContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});