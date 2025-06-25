
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation functions
function validateTradingChatRequest(body: any) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const { message, symbol, context } = body;

  // Validate message
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required and must be a string');
  }
  
  if (message.length === 0 || message.length > 2000) {
    throw new Error('Message must be between 1 and 2000 characters');
  }

  // Validate symbol if provided
  if (symbol !== undefined) {
    if (typeof symbol !== 'string') {
      throw new Error('Symbol must be a string');
    }
    
    const sanitizedSymbol = symbol.toUpperCase().trim().replace(/[^A-Z]/g, '');
    if (sanitizedSymbol.length === 0 || sanitizedSymbol.length > 10) {
      throw new Error('Symbol must be 1-10 uppercase letters');
    }
  }

  // Validate context if provided
  if (context !== undefined) {
    if (typeof context !== 'string') {
      throw new Error('Context must be a string');
    }
    
    if (context.length > 1000) {
      throw new Error('Context must be 1000 characters or less');
    }
  }

  return {
    message: message.trim(),
    symbol: symbol ? symbol.toUpperCase().trim().replace(/[^A-Z]/g, '') : undefined,
    context: context ? context.trim() : undefined
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate and sanitize input
    const validatedInput = validateTradingChatRequest(requestBody);
    
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
          { role: 'user', content: `${validatedInput.message}${validatedInput.symbol ? ` (Context: analyzing ${validatedInput.symbol})` : ''}${validatedInput.context ? ` Additional context: ${validatedInput.context}` : ''}` }
        ],
        tools: tools,
        tool_choice: "auto",
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error ${response.status}:`, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    
    // Handle function calls if present
    const assistantMessage = aiData.choices[0].message;
    if (assistantMessage.tool_calls) {
      console.log('Function calls requested:', assistantMessage.tool_calls);
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
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
