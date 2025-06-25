
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, analysisType, data } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'technical':
        systemPrompt = `You are an expert technical analyst specializing in options trading and wheel strategies. 
        Analyze the provided stock data and provide concise, actionable insights for wheel strategy implementation.
        Focus on entry points, strike selection, and risk assessment. Keep responses under 100 words.`;
        userPrompt = `Analyze ${symbol} technical data: ${JSON.stringify(data)}`;
        break;
        
      case 'options':
        systemPrompt = `You are an options strategy expert. Analyze the provided options data for wheel strategy optimization.
        Focus on IV rank, strike selection, probability of profit, and timing recommendations. Keep responses under 100 words.`;
        userPrompt = `Analyze ${symbol} options data for wheel strategy: ${JSON.stringify(data)}`;
        break;
        
      case 'risk':
        systemPrompt = `You are a risk management expert for options trading. Analyze the provided data and assess risks for wheel strategies.
        Focus on assignment probability, market conditions, and risk mitigation. Keep responses under 100 words.`;
        userPrompt = `Assess risks for ${symbol} wheel strategy: ${JSON.stringify(data)}`;
        break;
        
      default:
        systemPrompt = `You are a comprehensive trading analyst. Provide strategic insights for options wheel strategies.
        Keep responses concise and actionable, under 100 words.`;
        userPrompt = `Analyze ${symbol}: ${JSON.stringify(data)}`;
    }

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
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    const aiData = await response.json();
    const analysis = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      symbol,
      analysisType,
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
