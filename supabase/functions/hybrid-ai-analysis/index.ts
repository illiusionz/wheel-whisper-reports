
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelResponse {
  content: string;
  model: string;
  confidence: number;
  cost: number;
}

const callClaude = async (prompt: string, systemPrompt: string): Promise<ModelResponse> => {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anthropicApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    model: 'claude',
    confidence: 0.9,
    cost: 0.015
  };
};

const callOpenAI = async (prompt: string, systemPrompt: string): Promise<ModelResponse> => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: 'openai',
    confidence: 0.8,
    cost: 0.01
  };
};

const callPerplexity = async (prompt: string, systemPrompt: string): Promise<ModelResponse> => {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.2,
      return_related_questions: false,
      search_recency_filter: 'day'
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: 'perplexity',
    confidence: 0.85,
    cost: 0.02
  };
};

const modelCallers = {
  claude: callClaude,
  openai: callOpenAI,
  perplexity: callPerplexity
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisType, symbol, data, preferredModel, fallbackOrder, requiresRealTime } = await req.json();
    
    let systemPrompt = '';
    let userPrompt = '';

    // Build prompts based on analysis type
    switch (analysisType) {
      case 'technical':
        systemPrompt = `You are an expert technical analyst specializing in wheel strategies. 
        Provide concise, actionable insights for options trading. Focus on entry points, strike selection, and risk assessment.
        Keep responses under 150 words and be specific about actionable recommendations.`;
        userPrompt = `Analyze ${symbol} technical data for wheel strategy: ${JSON.stringify(data)}`;
        break;
        
      case 'options':
        systemPrompt = `You are an options strategy expert. Analyze for wheel strategy optimization, focusing on IV rank, strike selection, and timing.
        Provide specific recommendations for strike prices, expiration dates, and entry/exit criteria. Keep under 150 words.`;
        userPrompt = `Analyze ${symbol} options data for wheel strategy: ${JSON.stringify(data)}`;
        break;
        
      case 'risk':
        systemPrompt = `You are a risk management expert. Assess risks for wheel strategies, focusing on assignment probability and risk mitigation.
        Quantify risks where possible and provide specific mitigation strategies. Keep under 150 words.`;
        userPrompt = `Assess risks for ${symbol} wheel strategy: ${JSON.stringify(data)}`;
        break;

      case 'news':
      case 'sentiment':
        systemPrompt = `You are a market sentiment analyst. Analyze current news and market sentiment for trading decisions.
        Focus on how recent events might impact options trading and wheel strategies. Be concise and actionable.`;
        userPrompt = `Analyze current market sentiment and news for ${symbol}: ${JSON.stringify(data)}`;
        break;
        
      default:
        systemPrompt = `You are a comprehensive trading analyst. Provide strategic insights for options wheel strategies.
        Be specific, actionable, and concise. Focus on practical trading recommendations.`;
        userPrompt = `Analyze ${symbol}: ${JSON.stringify(data)}`;
    }

    let result: ModelResponse;
    const attemptOrder = fallbackOrder || ['claude', 'openai', 'perplexity'];
    let lastError: Error | null = null;

    // Try preferred model first, then fallbacks
    for (const modelName of attemptOrder) {
      try {
        console.log(`Attempting to call ${modelName} for ${analysisType} analysis`);
        result = await modelCallers[modelName as keyof typeof modelCallers](userPrompt, systemPrompt);
        console.log(`Successfully got response from ${modelName}`);
        break;
      } catch (error) {
        console.warn(`${modelName} failed:`, error);
        lastError = error as Error;
        
        // If this was the last model in the list, throw the error
        if (modelName === attemptOrder[attemptOrder.length - 1]) {
          throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
        }
        
        continue; // Try next model
      }
    }

    return new Response(JSON.stringify({
      content: result!.content,
      model: result!.model,
      confidence: result!.confidence,
      timestamp: new Date().toISOString(),
      cost: result!.cost
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Hybrid AI Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
