import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('📝 Poetry generation request received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyContent, storyTitle, language = 'it', maxLines = 15 } = await req.json();
    
    console.debug('POEM:request', { 
      storyTitle, 
      lang: language,
      contentLength: storyContent.length 
    });

    if (!storyContent) {
      throw new Error('Story content is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const isItalian = language === 'it';
    const systemPrompt = isItalian 
      ? `Scrivi una poesia in rima, divertente, adatta a bambini, ispirata al tema fornito dall'utente.
La poesia deve:
- Essere in lingua italiana
- Avere massimo ${maxLines} righe
- Essere allegra e creativa
- Essere in rima (se possibile)
- Usare un ritmo semplice e comprensibile anche per i più piccoli

Rispondi SOLO con la poesia, senza introduzioni o spiegazioni.`
      : `Write a rhyming poem, fun and suitable for children, inspired by the theme provided by the user.
The poem must:
- Be in English language
- Have maximum ${maxLines} lines
- Be cheerful and creative
- Be rhyming (if possible)
- Use a simple rhythm understandable for young children

Respond ONLY with the poem, without introductions or explanations.`;

    const userPrompt = isItalian
      ? `Storia: "${storyTitle ? storyTitle + ' - ' : ''}${storyContent}"

Crea una poesia in rima, divertente e adatta ai bambini, ispirata a questa storia.`
      : `Story: "${storyTitle ? storyTitle + ' - ' : ''}${storyContent}"

Create a rhyming poem, fun and suitable for children, inspired by this story.`;

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
    let poetry = data.choices[0].message.content.trim();

    // Remove any leading/trailing quotes or extra formatting
    poetry = poetry.replace(/^["']|["']$/g, '').trim();

    // Ensure max lines
    const lines = poetry.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > maxLines) {
      poetry = lines.slice(0, maxLines).join('\n');
    }

    console.debug('POEM:success', { 
      lines: poetry.split('\n').filter(line => line.trim().length > 0).length 
    });

    return new Response(JSON.stringify({ 
      poetry,
      language,
      lineCount: poetry.split('\n').filter(line => line.trim().length > 0).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.warn('POEM:error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});