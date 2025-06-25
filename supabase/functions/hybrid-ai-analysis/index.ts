import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens = 1000, temperature = 0.3 } = await req.json()
    
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
        console.error('Perplexity API key not found')
        throw new Error('Perplexity API key not configured')
      }
      console.log('Perplexity API key found, making request...')
      
      const result = await callPerplexityAPI(perplexityKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    } else if (selectedModel === 'openai') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) {
        console.error('OpenAI API key not found')
        throw new Error('OpenAI API key not configured')
      }
      console.log('OpenAI API key found, making request...')
      
      const result = await callOpenAIAPI(openaiKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    } else {
      // Default to Claude - more comprehensive API key checking
      console.log('Attempting Claude API call...')
      console.log('Environment variables check:')
      
      const envVars = Deno.env.toObject()
      const anthropicKeys = Object.keys(envVars).filter(key => 
        key.includes('ANTHROPIC') || key.includes('CLAUDE')
      )
      console.log('Found Anthropic/Claude related env vars:', anthropicKeys)
      
      // Try to get the API key from different possible names
      let anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
      let keySource = 'ANTHROPIC_API_KEY'
      
      if (!anthropicKey) {
        anthropicKey = Deno.env.get('CLAUDE_API_KEY')
        keySource = 'CLAUDE_API_KEY'
      }
      
      if (!anthropicKey) {
        anthropicKey = Deno.env.get('ANTHROPIC_KEY')
        keySource = 'ANTHROPIC_KEY'
      }
      
      console.log(`API key source: ${keySource}`)
      console.log(`API key found: ${!!anthropicKey}`)
      
      if (!anthropicKey) {
        console.error('No Claude/Anthropic API key found')
        console.error('Available environment variables:', Object.keys(envVars).slice(0, 10)) // Show first 10 for debugging
        throw new Error('Claude API key not configured. Please add ANTHROPIC_API_KEY to your Supabase Edge Function secrets.')
      }
      
      // Validate API key format
      if (!anthropicKey.startsWith('sk-ant-')) {
        console.error('Invalid Claude API key format. Expected key to start with sk-ant-')
        throw new Error('Invalid Claude API key format. Please check your ANTHROPIC_API_KEY.')
      }
      
      console.log(`Using Claude API key from ${keySource} (length: ${anthropicKey.length})`)
      
      const result = await callClaudeAPI(anthropicKey, contextPrompt, maxTokens)
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

Provide comprehensive technical analysis for ${symbol}:

**Technical Analysis for ${symbol}**

**Current Price Action:**
- Price: $${data.price}
- Change: ${data.change} (${data.changePercent?.toFixed(2)}%)

**Key Technical Levels:**
- Support and resistance levels
- Volume analysis and patterns
- Momentum indicators and trend direction

**Trading Recommendations:**
- Entry and exit points
- Risk management suggestions
- Price targets and stop losses

Provide specific, actionable technical analysis with clear insights.`

    case 'sentiment':
      return `${baseContext}
      
Current Stock Data: ${JSON.stringify(data, null, 2)}

Provide market sentiment analysis for ${symbol}:

**Market Sentiment Analysis for ${symbol}**

**Current Market Sentiment:**
- Overall market mood and trader sentiment
- Recent news impact and reactions
- Social media sentiment and retail behavior

**Key Sentiment Drivers:**
- Recent earnings or announcements
- Sector trends and peer performance
- Macroeconomic factors

**Sentiment Indicators:**
- Options flow and unusual activity
- Institutional vs retail sentiment
- Fear & greed indicators

Provide comprehensive sentiment analysis with specific insights.`

    case 'options':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide options strategy analysis:

**Options Strategy Analysis for ${symbol}**

**Current Options Environment:**
- Implied volatility levels
- Options flow analysis
- Put/call ratios

**Strategy Recommendations:**
- Specific options strategies
- Strike selection and timing
- Risk/reward profiles

**Risk Management:**
- Position sizing recommendations
- Exit strategies
- Hedging considerations

Give specific options strategies with actionable recommendations.`

    case 'risk':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide risk assessment:

**Risk Assessment for ${symbol}**

**Volatility Analysis:**
- Historical and implied volatility
- Beta and correlation analysis
- Risk-adjusted metrics

**Key Risk Factors:**
- Company-specific risks
- Sector and market risks
- Macroeconomic factors

**Risk Management:**
- Position sizing recommendations
- Diversification strategies
- Hedging approaches

Provide detailed risk analysis with mitigation strategies.`

    default:
      return `${baseContext}
      
Analyze ${symbol} with current data: ${JSON.stringify(data, null, 2)}
      
Provide comprehensive financial analysis with specific insights and actionable recommendations.`
  }
}

async function callClaudeAPI(apiKey: string, prompt: string, maxTokens: number) {
  console.log('=== Claude API Call Details ===')
  console.log('API Key length:', apiKey.length)
  console.log('API Key starts with sk-ant-:', apiKey.startsWith('sk-ant-'))
  console.log('API Key first 15 chars:', apiKey.substring(0, 15) + '...')
  console.log('Prompt length:', prompt.length)
  console.log('Max tokens:', maxTokens)
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: Math.min(maxTokens, 4000),
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  }
  
  console.log('Making request to Claude API...')
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Claude API response status:', response.status)
    console.log('Claude API response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Claude API error details:`)
      console.error(`Status: ${response.status}`)
      console.error(`Status Text: ${response.statusText}`)
      console.error(`Error Response: ${errorText}`)
      
      if (response.status === 401) {
        throw new Error('Claude API authentication failed. The API key is invalid or expired. Please verify your ANTHROPIC_API_KEY in Supabase secrets.')
      } else if (response.status === 400) {
        throw new Error(`Claude API request error: ${errorText}`)
      } else if (response.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`Claude API error (${response.status}): ${errorText}`)
      }
    }

    const data = await response.json()
    console.log('Claude API response received successfully')
    console.log('Response has content array:', Array.isArray(data.content))
    console.log('Content array length:', data.content?.length || 0)
    
    if (data.content && data.content[0]) {
      console.log('First content item type:', data.content[0].type)
      console.log('First content item text length:', data.content[0].text?.length || 0)
    }
    
    const content = data.content?.[0]?.text || ''
    
    if (!content) {
      console.error('No content in Claude response:')
      console.error('Full response:', JSON.stringify(data, null, 2))
      throw new Error('Claude API returned empty content')
    }
    
    console.log('Claude analysis completed successfully')
    return {
      content,
      confidence: 0.85
    }
    
  } catch (error) {
    console.error('Error in callClaudeAPI:', error)
    throw error
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
      max_tokens: Math.min(maxTokens, 4000)
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
      model: 'gpt-4o-mini',
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
      max_tokens: Math.min(maxTokens, 4000),
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
