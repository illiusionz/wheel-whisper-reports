import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== HYBRID AI ANALYSIS REQUEST START ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    const requestBody = await req.json()
    console.log('Request body received:', JSON.stringify(requestBody, null, 2))
    
    const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens = 1000, temperature = 0.3 } = requestBody
    
    console.log(`=== ANALYSIS CONFIGURATION ===`)
    console.log(`Analysis Type: ${analysisType}`)
    console.log(`Symbol: ${symbol}`)
    console.log(`Force Model: ${forceModel}`)
    console.log(`Max Tokens: ${maxTokens}`)
    console.log(`Temperature: ${temperature}`)
    console.log(`Requires Real Time: ${requiresRealTime}`)
    console.log(`Data provided: ${JSON.stringify(data)}`)
    
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

    console.log(`=== MODEL SELECTION ===`)
    console.log(`Selected model: ${selectedModel} for ${analysisType} analysis`)

    // Build context-aware prompt
    const contextPrompt = buildContextPrompt(analysisType, symbol, data)
    console.log(`=== PROMPT BUILT ===`)
    console.log(`Prompt length: ${contextPrompt.length} characters`)
    console.log(`First 200 chars of prompt: ${contextPrompt.substring(0, 200)}...`)
    
    let analysis = ''
    let confidence = 0.7
    
    if (selectedModel === 'perplexity') {
      console.log('=== CALLING PERPLEXITY API ===')
      const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')
      if (!perplexityKey) {
        console.error('❌ PERPLEXITY API KEY NOT FOUND')
        throw new Error('Perplexity API key not configured')
      }
      console.log('✅ Perplexity API key found, making request...')
      
      const result = await callPerplexityAPI(perplexityKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ Perplexity analysis completed: ${analysis.length} characters`)
    } else if (selectedModel === 'openai') {
      console.log('=== CALLING OPENAI API ===')
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) {
        console.error('❌ OPENAI API KEY NOT FOUND')
        throw new Error('OpenAI API key not configured')
      }
      console.log('✅ OpenAI API key found, making request...')
      
      const result = await callOpenAIAPI(openaiKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ OpenAI analysis completed: ${analysis.length} characters`)
    } else {
      console.log('=== CALLING CLAUDE API ===')
      console.log('Checking environment variables...')
      
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
      
      console.log(`=== API KEY CHECK ===`)
      console.log(`Key source: ${keySource}`)
      console.log(`Key found: ${!!anthropicKey}`)
      console.log(`Key length: ${anthropicKey ? anthropicKey.length : 0}`)
      console.log(`Key starts with sk-ant-: ${anthropicKey ? anthropicKey.startsWith('sk-ant-') : false}`)
      
      if (!anthropicKey) {
        console.error('❌ NO CLAUDE/ANTHROPIC API KEY FOUND')
        console.error('Available environment variables:', Object.keys(envVars).slice(0, 20))
        throw new Error('Claude API key not configured. Please add ANTHROPIC_API_KEY to your Supabase Edge Function secrets.')
      }
      
      // Validate API key format
      if (!anthropicKey.startsWith('sk-ant-')) {
        console.error('❌ INVALID CLAUDE API KEY FORMAT')
        console.error(`Expected key to start with 'sk-ant-', got: ${anthropicKey.substring(0, 10)}...`)
        throw new Error('Invalid Claude API key format. Please check your ANTHROPIC_API_KEY.')
      }
      
      console.log(`✅ Using Claude API key from ${keySource}`)
      
      const result = await callClaudeAPI(anthropicKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ Claude analysis completed: ${analysis.length} characters`)
    }

    // Ensure we have a complete response
    console.log(`=== RESPONSE VALIDATION ===`)
    console.log(`Analysis length: ${analysis ? analysis.length : 0}`)
    console.log(`Analysis is empty: ${!analysis || analysis.trim().length === 0}`)
    
    if (!analysis || analysis.trim().length === 0) {
      console.error('❌ EMPTY ANALYSIS RECEIVED FROM AI MODEL')
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

    console.log(`=== SUCCESS RESPONSE ===`)
    console.log(`Response content length: ${response.content.length}`)
    console.log(`Response model: ${response.model}`)
    console.log(`Response confidence: ${response.confidence}`)
    console.log('=== HYBRID AI ANALYSIS REQUEST END ===')

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('=== HYBRID AI ANALYSIS ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('=== END ERROR ===')
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate AI analysis',
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
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
  console.log('=== CLAUDE API CALL START ===')
  console.log('API Key length:', apiKey.length)
  console.log('API Key starts with sk-ant-:', apiKey.startsWith('sk-ant-'))
  console.log('API Key prefix (first 15 chars):', apiKey.substring(0, 15) + '...')
  console.log('Prompt length:', prompt.length)
  console.log('Max tokens requested:', maxTokens)
  
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
  
  console.log('Claude request body:', JSON.stringify(requestBody, null, 2))
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

    console.log('=== CLAUDE API RESPONSE ===')
    console.log('Response status:', response.status)
    console.log('Response status text:', response.statusText)
    console.log('Response ok:', response.ok)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== CLAUDE API ERROR DETAILS ===')
      console.error(`Status: ${response.status}`)
      console.error(`Status Text: ${response.statusText}`)
      console.error(`Error Response Body: ${errorText}`)
      console.error('=== END CLAUDE API ERROR ===')
      
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
    console.log('=== CLAUDE API SUCCESS RESPONSE ===')
    console.log('Response data keys:', Object.keys(data))
    console.log('Response has content array:', Array.isArray(data.content))
    console.log('Content array length:', data.content?.length || 0)
    
    if (data.content && data.content[0]) {
      console.log('First content item keys:', Object.keys(data.content[0]))
      console.log('First content item type:', data.content[0].type)
      console.log('First content item text length:', data.content[0].text?.length || 0)
      console.log('First 100 chars of response:', data.content[0].text?.substring(0, 100) || '')
    }
    
    const content = data.content?.[0]?.text || ''
    
    if (!content) {
      console.error('=== EMPTY CONTENT FROM CLAUDE ===')
      console.error('Full response data:', JSON.stringify(data, null, 2))
      throw new Error('Claude API returned empty content')
    }
    
    console.log('✅ Claude analysis completed successfully')
    console.log('Content length:', content.length)
    console.log('=== CLAUDE API CALL END ===')
    
    return {
      content,
      confidence: 0.85
    }
    
  } catch (error) {
    console.error('=== ERROR IN CLAUDE API CALL ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('=== END CLAUDE API CALL ERROR ===')
    throw error
  }
}

async function callPerplexityAPI(apiKey: string, prompt: string, maxTokens: number) {
  console.log('=== PERPLEXITY API CALL START ===')
  console.log('API Key length:', apiKey.length)
  console.log('Prompt length:', prompt.length)
  console.log('Max tokens:', maxTokens)
  
  const requestBody = {
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
  }
  
  console.log('Perplexity request body:', JSON.stringify(requestBody, null, 2))

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log('Perplexity response status:', response.status)
  console.log('Perplexity response ok:', response.ok)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Perplexity API error ${response.status}:`, errorText)
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('Perplexity API response received successfully')
  console.log('Response data keys:', Object.keys(data))
  
  const content = data.choices[0].message.content || ''
  console.log('Perplexity content length:', content.length)
  console.log('=== PERPLEXITY API CALL END ===')
  
  return {
    content,
    confidence: 0.80
  }
}

async function callOpenAIAPI(apiKey: string, prompt: string, maxTokens: number) {
  console.log('=== OPENAI API CALL START ===')
  console.log('API Key length:', apiKey.length)
  console.log('Prompt length:', prompt.length)
  console.log('Max tokens:', maxTokens)
  
  const requestBody = {
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
  }
  
  console.log('OpenAI request body:', JSON.stringify(requestBody, null, 2))

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log('OpenAI response status:', response.status)
  console.log('OpenAI response ok:', response.ok)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`OpenAI API error ${response.status}:`, errorText)
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('OpenAI API response received successfully')
  console.log('Response data keys:', Object.keys(data))
  
  const content = data.choices[0].message.content || ''
  console.log('OpenAI content length:', content.length)
  console.log('=== OPENAI API CALL END ===')
  
  return {
    content,
    confidence: 0.82
  }
}
