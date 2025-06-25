
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

console.log('🚀 HYBRID AI ANALYSIS FUNCTION INITIALIZING...')
console.log('📊 Function startup time:', new Date().toISOString())

serve(async (req) => {
  // Add startup logging to verify function is running
  console.log('🔥 FUNCTION CALLED - ALIVE AND RESPONDING!')
  console.log('⏰ Request received at:', new Date().toISOString())
  console.log('🌐 Request method:', req.method)
  console.log('📍 Request URL:', req.url)
  console.log('🔧 User-Agent:', req.headers.get('user-agent'))
  console.log('🔑 Authorization present:', req.headers.has('authorization'))
  console.log('📦 Content-Type:', req.headers.get('content-type'))
  console.log('🏠 Origin:', req.headers.get('origin'))

  try {
    // Handle CORS preflight requests first
    if (req.method === 'OPTIONS') {
      console.log('✅ Handling CORS preflight request')
      return new Response('ok', { 
        headers: corsHeaders,
        status: 200 
      })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('❌ Invalid method:', req.method)
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          received: req.method,
          expected: 'POST'
        }),
        { 
          status: 405,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log('📝 Processing POST request...')

    let requestBody;
    try {
      requestBody = await req.json()
      console.log('✅ Request body parsed successfully')
      console.log('📋 Request payload keys:', Object.keys(requestBody))
      console.log('🎯 Analysis type:', requestBody.analysisType)
      console.log('💼 Symbol:', requestBody.symbol)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      )
    }
    
    // Validate and sanitize input
    console.log('🔎 Validating request...')
    const validatedRequest = validateHybridAIRequest(requestBody);
    console.log('✅ Request validation successful')
    
    console.log(`🎯 Analysis Configuration:`)
    console.log(`   Type: ${validatedRequest.analysisType}`)
    console.log(`   Symbol: ${validatedRequest.symbol}`)
    console.log(`   Force Model: ${validatedRequest.forceModel || 'auto'}`)
    console.log(`   Max Tokens: ${validatedRequest.maxTokens}`)
    console.log(`   Temperature: ${validatedRequest.temperature}`)
    console.log(`   Real Time: ${validatedRequest.requiresRealTime}`)
    
    // Determine the best model for the analysis type
    const selectedModel = selectOptimalModel(validatedRequest.analysisType, validatedRequest.forceModel)
    console.log(`🤖 Selected AI model: ${selectedModel}`)

    // Get API key for selected model
    console.log(`🔑 Getting API key for ${selectedModel}...`)
    const { key: apiKey, source: keySource } = getAPIKey(selectedModel)
    if (!apiKey) {
      console.error(`❌ API key not found for ${selectedModel}`)
      return new Response(
        JSON.stringify({ 
          error: `${selectedModel.toUpperCase()} API key not configured`,
          details: `Please add ${keySource} to your Supabase Edge Function secrets`,
          model: selectedModel
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
    console.log(`✅ Using ${selectedModel} API key from ${keySource}`)

    // Build context-aware prompt
    console.log('📝 Building analysis prompt...')
    const contextPrompt = buildContextPrompt(validatedRequest.analysisType, validatedRequest.symbol, validatedRequest.data)
    console.log(`✅ Prompt built (${contextPrompt.length} characters)`)
    
    let analysis = ''
    let confidence = 0.7
    
    // Call the appropriate AI service
    console.log(`🚀 Calling ${selectedModel} API...`)
    try {
      if (selectedModel === 'perplexity') {
        const result = await callPerplexityAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
        analysis = result.content
        confidence = result.confidence
      } else if (selectedModel === 'openai') {
        const result = await callOpenAIAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
        analysis = result.content
        confidence = result.confidence
      } else {
        const result = await callClaudeAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
        analysis = result.content
        confidence = result.confidence
      }
      console.log(`✅ ${selectedModel} analysis completed (${analysis.length} characters)`)
    } catch (aiError) {
      console.error(`❌ ${selectedModel} API call failed:`, aiError)
      return new Response(
        JSON.stringify({ 
          error: `Failed to get analysis from ${selectedModel}`,
          details: aiError.message,
          model: selectedModel
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

    // Validate response
    console.log('🔍 Validating AI response...')
    if (!analysis || analysis.trim().length === 0) {
      console.error('❌ Empty analysis received from AI model')
      return new Response(
        JSON.stringify({ 
          error: 'Empty response from AI model',
          model: selectedModel
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

    console.log('🎉 SUCCESS - Returning analysis response')
    console.log(`   Content length: ${response.content.length}`)
    console.log(`   Model: ${response.model}`)
    console.log(`   Confidence: ${response.confidence}`)
    console.log('⏰ Request completed at:', new Date().toISOString())

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
    console.error('💥 CRITICAL ERROR in hybrid-ai-analysis function:')
    console.error('   Error type:', error.constructor.name)
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    console.error('⏰ Error occurred at:', new Date().toISOString())
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Critical failure in AI analysis function',
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

console.log('🎯 HYBRID AI ANALYSIS FUNCTION READY TO SERVE')
