
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, symbol, context } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert MCP (Market-Changing-Patterns) trading assistant specializing in wheel strategies and options trading.

    You have access to real-time market data through function calls. When users ask about specific stocks or strategies:
    1. Call get_stock_data to fetch current market information
    2. Call get_options_data to get options chain information
    3. Provide strategic wheel strategy recommendations
    4. Focus on risk management and probability of profit
    5. Give specific strike prices, expirations, and entry criteria
    
    Always be concise but thorough in your analysis. If you need current data, use the available functions.`;

    const tools = [
      {
        type: "function",
        name: "get_stock_data",
        description: "Get current stock price, volume, and technical indicators for a symbol",
        parameters: {
          type: "object",
          properties: {
            symbol: { type: "string", description: "Stock symbol to analyze" }
          },
          required: ["symbol"]
        }
      },
      {
        type: "function", 
        name: "get_options_data",
        description: "Get options chain data including strikes, expirations, and Greeks",
        parameters: {
          type: "object",
          properties: {
            symbol: { type: "string", description: "Stock symbol for options" },
            expiration: { type: "string", description: "Expiration date (optional)" }
          },
          required: ["symbol"]
        }
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${message}${symbol ? ` (Context: analyzing ${symbol})` : ''}${context ? ` Additional context: ${context}` : ''}` }
        ],
        tools: tools,
        tool_choice: "auto",
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    const aiData = await response.json();
    
    // Handle function calls if present
    const assistantMessage = aiData.choices[0].message;
    if (assistantMessage.tool_calls) {
      // Process function calls here
      console.log('Function calls requested:', assistantMessage.tool_calls);
      // For now, return the message indicating functions would be called
      return new Response(JSON.stringify({
        message: assistantMessage.content || "I need to fetch current market data to provide accurate analysis.",
        functionCalls: assistantMessage.tool_calls,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      message: assistantMessage.content,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Trading chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
