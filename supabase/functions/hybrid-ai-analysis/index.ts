
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens = 1500, temperature = 0.3 } = await req.json()
    
    console.log(`Hybrid AI Analysis Request: ${analysisType} for ${symbol}`)
    
    // Determine the best model for the analysis type
    let selectedModel = forceModel || 'claude'
    
    if (!forceModel) {
      switch (analysisType) {
        case 'news':
        case 'sentiment':
          selectedModel = 'perplexity'
          break
        case 'technical':
        case 'options':
        case 'risk':
          selectedModel = 'claude'
          break
        default:
          selectedModel = 'claude'
      }
    }

    console.log(`Using model: ${selectedModel} for ${analysisType} analysis`)

    // Build context-aware prompt
    const contextPrompt = buildContextPrompt(analysisType, symbol, data)
    
    let analysis = ''
    let confidence = 0.7
    
    if (selectedModel === 'perplexity') {
      const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')
      if (!perplexityKey) {
        console.error('Perplexity API key not found in environment')
        throw new Error('Perplexity API key not configured')
      }
      console.log('Perplexity API key found, making request...')
      
      const result = await callPerplexityAPI(perplexityKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    } else if (selectedModel === 'claude') {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicKey) {
        console.error('Anthropic API key not found in environment')
        throw new Error('Anthropic API key not configured')
      }
      console.log('Anthropic API key found, making request...')
      
      const result = await callClaudeAPI(anthropicKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    } else if (selectedModel === 'openai') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) {
        console.error('OpenAI API key not found in environment')
        throw new Error('OpenAI API key not configured')
      }
      console.log('OpenAI API key found, making request...')
      
      const result = await callOpenAIAPI(openaiKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    }

    // Ensure we have a complete response
    if (!analysis || analysis.trim().length === 0) {
      console.error('Empty analysis received from AI model')
      throw new Error('Empty response from AI model')
    }

    const response = {
      content: analysis,
      model: selectedModel,
      confidence: confidence,
      timestamp: new Date().toISOString(),
      metadata: {
        analysisType,
        symbol,
        tokenCount: analysis.length,
        modelUsed: selectedModel
      }
    }

    console.log(`Analysis completed for ${symbol}: ${analysis.length} characters`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Hybrid AI Analysis Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate AI analysis',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

function buildContextPrompt(analysisType: string, symbol: string, data: any): string {
  const baseContext = `You are an expert financial analyst providing detailed analysis for ${symbol}.`
  
  switch (analysisType) {
    case 'technical':
      return `${baseContext}
      
Current Stock Data: ${JSON.stringify(data, null, 2)}

Provide a comprehensive technical analysis including:

### Technical Analysis for ${symbol}

**Current Price Action:**
- Price: $${data.price}
- Change: ${data.change} (${data.changePercent?.toFixed(2)}%)

**Key Technical Levels:**
- Support and resistance levels based on current price action
- Volume analysis and trading patterns
- Momentum indicators and trend direction

**Trading Recommendations:**
- Entry and exit points
- Risk management suggestions
- Price targets and stop losses

Provide specific, actionable technical analysis with clear price targets and risk assessments.`

    case 'sentiment':
      return `${baseContext}
      
Current Stock Data: ${JSON.stringify(data, null, 2)}

Provide real-time market sentiment analysis for ${symbol}:

### Market Sentiment Analysis for ${symbol}

**Current Market Sentiment:**
- Overall market mood and trader sentiment
- Recent news impact and market reactions
- Social media sentiment and retail investor behavior

**Key Sentiment Drivers:**
- Recent earnings or company announcements
- Sector trends and peer performance
- Macroeconomic factors affecting sentiment

**Sentiment Indicators:**
- Options flow and unusual activity
- Institutional vs retail sentiment
- Fear & greed indicators

Provide comprehensive sentiment analysis with specific insights about current market psychology.`

    case 'options':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide detailed options strategy analysis:

### Options Strategy Analysis for ${symbol}

**Current Options Environment:**
- Implied volatility levels and trends
- Options flow and unusual activity
- Put/call ratios and sentiment

**Strategy Recommendations:**
- Specific options strategies for current market conditions
- Strike selection and expiration timing
- Risk/reward profiles for each strategy

**Risk Management:**
- Position sizing recommendations
- Exit strategies and profit targets
- Hedging considerations

Give specific options strategies with strike recommendations and risk assessments.`

    case 'risk':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide comprehensive risk assessment:

### Risk Assessment for ${symbol}

**Volatility Analysis:**
- Historical and implied volatility trends
- Beta and correlation analysis
- Risk-adjusted return metrics

**Key Risk Factors:**
- Company-specific risks
- Sector and market risks
- Macroeconomic risk factors

**Risk Management:**
- Position sizing recommendations
- Diversification strategies
- Hedging approaches

Provide detailed risk analysis with specific mitigation strategies.`

    default:
      return `${baseContext}
      
Analyze ${symbol} with current data: ${JSON.stringify(data, null, 2)}
      
Provide comprehensive financial analysis with specific insights and actionable recommendations.`
  }
}

async function callClaudeAPI(apiKey: string, prompt: string, maxTokens: number) {
  console.log('Making Claude API request...')
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Claude API error ${response.status}:`, errorText)
    throw new Error(`Claude API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('Claude API response received successfully')
  
  return {
    content: data.content[0].text || '',
    confidence: 0.85
  }
}

async function callPerplexityAPI(apiKey: string, prompt: string, maxTokens: number) {
  console.log('Making Perplexity API request...')
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst providing detailed, comprehensive analysis. Always provide complete responses with specific insights and actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: maxTokens,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'day',
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Perplexity API error ${response.status}:`, errorText)
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('Perplexity API response received successfully')
  
  return {
    content: data.choices[0].message.content || '',
    confidence: 0.80
  }
}

async function callOpenAIAPI(apiKey: string, prompt: string, maxTokens: number) {
  console.log('Making OpenAI API request...')
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst providing detailed, comprehensive analysis. Always provide complete responses with specific insights and actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`OpenAI API error ${response.status}:`, errorText)
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('OpenAI API response received successfully')
  
  return {
    content: data.choices[0].message.content || '',
    confidence: 0.82
  }
}
