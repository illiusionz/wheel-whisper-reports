
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { callClaudeAPI } from './providers/claude.ts'
import { callPerplexityAPI } from './providers/perplexity.ts'
import { callOpenAIAPI } from './providers/openai.ts'
import { buildContextPrompt } from './utils/prompts.ts'
import { selectOptimalModel, getAPIKey } from './utils/config.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== HYBRID AI ANALYSIS REQUEST START ===')
  console.log('Request method:', req.method)

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
    
    const { 
      analysisType, 
      symbol, 
      data, 
      requiresRealTime, 
      forceModel, 
      maxTokens = 1000, 
      temperature = 0.3 
    } = requestBody
    
    console.log(`=== ANALYSIS CONFIGURATION ===`)
    console.log(`Analysis Type: ${analysisType}`)
    console.log(`Symbol: ${symbol}`)
    console.log(`Force Model: ${forceModel}`)
    console.log(`Max Tokens: ${maxTokens}`)
    console.log(`Temperature: ${temperature}`)
    console.log(`Requires Real Time: ${requiresRealTime}`)
    
    // Determine the best model for the analysis type
    const selectedModel = selectOptimalModel(analysisType, forceModel)
    console.log(`=== MODEL SELECTION ===`)
    console.log(`Selected model: ${selectedModel} for ${analysisType} analysis`)

    // Get API key for selected model
    const { key: apiKey, source: keySource } = getAPIKey(selectedModel)
    console.log(`✅ Using ${selectedModel} API key from ${keySource}`)

    // Build context-aware prompt
    const contextPrompt = buildContextPrompt(analysisType, symbol, data)
    console.log(`=== PROMPT BUILT ===`)
    console.log(`Prompt length: ${contextPrompt.length} characters`)
    
    let analysis = ''
    let confidence = 0.7
    
    // Call the appropriate AI service
    if (selectedModel === 'perplexity') {
      console.log('=== CALLING PERPLEXITY API ===')
      const result = await callPerplexityAPI(apiKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ Perplexity analysis completed: ${analysis.length} characters`)
    } else if (selectedModel === 'openai') {
      console.log('=== CALLING OPENAI API ===')
      const result = await callOpenAIAPI(apiKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ OpenAI analysis completed: ${analysis.length} characters`)
    } else {
      console.log('=== CALLING CLAUDE API ===')
      const result = await callClaudeAPI(apiKey, contextPrompt, maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ Claude analysis completed: ${analysis.length} characters`)
    }

    // Validate response
    console.log(`=== RESPONSE VALIDATION ===`)
    console.log(`Analysis length: ${analysis ? analysis.length : 0}`)
    
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
