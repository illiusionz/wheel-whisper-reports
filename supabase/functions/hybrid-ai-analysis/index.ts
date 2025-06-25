
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

// Input validation functions
function validateHybridAIRequest(body: any) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens, temperature } = body;

  // Validate analysis type
  const validAnalysisTypes = ['technical', 'options', 'risk', 'sentiment', 'news', 'general'];
  if (!analysisType || !validAnalysisTypes.includes(analysisType)) {
    throw new Error(`Invalid analysis type. Must be one of: ${validAnalysisTypes.join(', ')}`);
  }

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Symbol is required and must be a string');
  }
  
  const sanitizedSymbol = symbol.toUpperCase().trim().replace(/[^A-Z]/g, '');
  if (sanitizedSymbol.length === 0 || sanitizedSymbol.length > 10) {
    throw new Error('Symbol must be 1-10 uppercase letters');
  }

  // Validate force model if provided
  const validModels = ['claude', 'openai', 'perplexity'];
  if (forceModel && !validModels.includes(forceModel)) {
    throw new Error(`Invalid force model. Must be one of: ${validModels.join(', ')}`);
  }

  // Validate max tokens
  const validatedMaxTokens = maxTokens && typeof maxTokens === 'number' && maxTokens > 0 && maxTokens <= 4000 
    ? Math.floor(maxTokens) 
    : 1000;

  // Validate temperature
  const validatedTemperature = temperature && typeof temperature === 'number' && temperature >= 0 && temperature <= 2
    ? temperature
    : 0.3;

  return {
    analysisType,
    symbol: sanitizedSymbol,
    data: data || {},
    requiresRealTime: Boolean(requiresRealTime),
    forceModel: forceModel || undefined,
    maxTokens: validatedMaxTokens,
    temperature: validatedTemperature
  };
}

serve(async (req) => {
  console.log('=== HYBRID AI ANALYSIS REQUEST START ===')
  console.log('Request method:', req.method)
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
    
    // Validate and sanitize input
    const validatedRequest = validateHybridAIRequest(requestBody);
    
    console.log(`=== ANALYSIS CONFIGURATION ===`)
    console.log(`Analysis Type: ${validatedRequest.analysisType}`)
    console.log(`Symbol: ${validatedRequest.symbol}`)
    console.log(`Force Model: ${validatedRequest.forceModel}`)
    console.log(`Max Tokens: ${validatedRequest.maxTokens}`)
    console.log(`Temperature: ${validatedRequest.temperature}`)
    console.log(`Requires Real Time: ${validatedRequest.requiresRealTime}`)
    
    // Determine the best model for the analysis type
    const selectedModel = selectOptimalModel(validatedRequest.analysisType, validatedRequest.forceModel)
    console.log(`=== MODEL SELECTION ===`)
    console.log(`Selected model: ${selectedModel} for ${validatedRequest.analysisType} analysis`)

    // Get API key for selected model
    const { key: apiKey, source: keySource } = getAPIKey(selectedModel)
    if (!apiKey) {
      throw new Error(`${selectedModel.toUpperCase()} API key not configured in Supabase secrets`)
    }
    console.log(`✅ Using ${selectedModel} API key from ${keySource}`)

    // Build context-aware prompt
    const contextPrompt = buildContextPrompt(validatedRequest.analysisType, validatedRequest.symbol, validatedRequest.data)
    console.log(`=== PROMPT BUILT ===`)
    console.log(`Prompt length: ${contextPrompt.length} characters`)
    
    let analysis = ''
    let confidence = 0.7
    
    // Call the appropriate AI service
    if (selectedModel === 'perplexity') {
      console.log('=== CALLING PERPLEXITY API ===')
      const result = await callPerplexityAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ Perplexity analysis completed: ${analysis.length} characters`)
    } else if (selectedModel === 'openai') {
      console.log('=== CALLING OPENAI API ===')
      const result = await callOpenAIAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
      analysis = result.content
      confidence = result.confidence
      console.log(`✅ OpenAI analysis completed: ${analysis.length} characters`)
    } else {
      console.log('=== CALLING CLAUDE API ===')
      const result = await callClaudeAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
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
        analysisType: validatedRequest.analysisType,
        symbol: validatedRequest.symbol,
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
        error: error.message || 'Internal server error',
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
