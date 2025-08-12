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
    const { storyContent, storyTitle, language = 'it', maxLines = 10 } = await req.json();

    if (!storyContent) {
      throw new Error('Story content is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `Scrivi una poesia in rima, divertente, adatta a bambini, ispirata al tema fornito dall'utente.
La poesia deve:
- Essere in lingua italiana
- Avere tra 5 e 15 righe
- Essere allegra e creativa
- Essere in rima (se possibile)
- Usare un ritmo semplice e comprensibile anche per i più piccoli

Rispondi SOLO con la poesia, senza introduzioni o spiegazioni.`;

    const userPrompt = `Storia: "${storyTitle ? storyTitle + ' - ' : ''}${storyContent}"

Crea una poesia in rima, divertente e adatta ai bambini, ispirata a questa storia.`;

    console.log('Generating poetry with OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const poetry = data.choices[0].message.content.trim();

    console.log('Poetry generated successfully');

    return new Response(JSON.stringify({ poetry }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-poetry function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});