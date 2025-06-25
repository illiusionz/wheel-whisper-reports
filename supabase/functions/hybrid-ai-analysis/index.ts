
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
    const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens = 2000 } = await req.json()
    
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
        throw new Error('Perplexity API key not configured')
      }
      
      const result = await callPerplexityAPI(perplexityKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    } else if (selectedModel === 'claude') {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicKey) {
        throw new Error('Anthropic API key not configured')
      }
      
      const result = await callClaudeAPI(anthropicKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    } else if (selectedModel === 'openai') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) {
        throw new Error('OpenAI API key not configured')
      }
      
      const result = await callOpenAIAPI(openaiKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
    }

    // Ensure we have a complete response
    if (!analysis || analysis.trim().length === 0) {
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
        details: 'Failed to generate AI analysis'
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

**Support Levels:**
[Analyze support levels based on current price]

**Resistance Levels:** 
[Analyze resistance levels]

**Volume Analysis:**
[Analyze trading volume patterns]

**Strike Selection:**
[Provide specific strike recommendations]

**Risk Assessment:**
[Detailed risk analysis]

Please provide a complete, detailed analysis with specific price targets and actionable insights.`

    case 'sentiment':
      return `${baseContext}
      
Current Stock Data: ${JSON.stringify(data, null, 2)}

Provide real-time market sentiment analysis for ${symbol}:

### Market Sentiment Analysis for ${symbol}

**Key Points:**

**Price Movement:**
[Analyze recent price action and sentiment]

**Volume:**
[Analyze trading volume and market interest]

**Market Factors:**
[Discuss relevant market factors affecting sentiment]

**News Impact:**
[Analyze any recent news or events]

**Sentiment Indicators:**
[Provide sentiment metrics and indicators]

Provide a comprehensive sentiment analysis with specific insights about market mood and trader behavior.`

    case 'options':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide detailed options strategy analysis:

### Options Strategy Analysis for ${symbol}

**Current Options Environment:**
[Analyze current options activity]

**Strategy Recommendations:**
[Provide specific options strategies]

**Strike Selection:**
[Recommend specific strikes with rationale]

**Risk Management:**
[Detail risk management approaches]

**Expected Outcomes:**
[Provide probability-based outcomes]

Give complete options analysis with specific strike recommendations and risk assessments.`

    case 'risk':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide comprehensive risk assessment:

### Risk Assessment for ${symbol}

**Volatility Analysis:**
[Analyze current and historical volatility]

**Downside Risks:**
[Identify key downside risks]

**Upside Potential:**
[Assess upside scenarios]

**Risk Mitigation:**
[Provide risk mitigation strategies]

**Position Sizing:**
[Recommend appropriate position sizing]

Provide detailed risk analysis with specific recommendations for risk management.`

    default:
      return `${baseContext}
      
Analyze ${symbol} with current data: ${JSON.stringify(data, null, 2)}
      
Provide comprehensive analysis relevant to ${analysisType} with specific insights and recommendations.`
  }
}

async function callClaudeAPI(apiKey: string, prompt: string, maxTokens: number) {
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
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.content[0].text || '',
    confidence: 0.85
  }
}

async function callPerplexityAPI(apiKey: string, prompt: string, maxTokens: number) {
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
    throw new Error(`Perplexity API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0].message.content || '',
    confidence: 0.80
  }
}

async function callOpenAIAPI(apiKey: string, prompt: string, maxTokens: number) {
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
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0].message.content || '',
    confidence: 0.82
  }
}
