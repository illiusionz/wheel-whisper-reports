
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
  console.log('🔍 VALIDATING REQUEST BODY:', JSON.stringify(body, null, 2))
  
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body - must be a valid JSON object');
  }

  const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens, temperature } = body;

  // Validate analysis type
  const validAnalysisTypes = ['technical', 'options', 'risk', 'sentiment', 'news', 'general'];
  if (!analysisType || !validAnalysisTypes.includes(analysisType)) {
    throw new Error(`Invalid analysis type "${analysisType}". Must be one of: ${validAnalysisTypes.join(', ')}`);
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
    throw new Error(`Invalid force model "${forceModel}". Must be one of: ${validModels.join(', ')}`);
  }

  // Validate max tokens
  const validatedMaxTokens = maxTokens && typeof maxTokens === 'number' && maxTokens > 0 && maxTokens <= 4000 
    ? Math.floor(maxTokens) 
    : 1000;

  // Validate temperature
  const validatedTemperature = temperature && typeof temperature === 'number' && temperature >= 0 && temperature <= 2
    ? temperature
    : 0.3;

  console.log('✅ REQUEST VALIDATION SUCCESSFUL')
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
  console.log('🔥 FUNCTION CALLED - REQUEST RECEIVED!')
  console.log('⏰ Request time:', new Date().toISOString())
  console.log('🌐 Method:', req.method)
  console.log('📍 URL:', req.url)

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('✅ CORS preflight - returning headers')
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

    // Parse request body with timeout protection
    let requestBody;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const bodyText = await req.text();
      clearTimeout(timeoutId);
      
      console.log('📄 Raw request body length:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('✅ Request body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message,
          received: typeof parseError === 'object' ? parseError.name : 'Unknown error'
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
    let validatedRequest;
    try {
      validatedRequest = validateHybridAIRequest(requestBody);
      console.log('✅ Request validation successful');
    } catch (validationError) {
      console.error('❌ Validation error:', validationError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Request validation failed',
          details: validationError.message 
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
    
    console.log(`🎯 Analysis Configuration:`)
    console.log(`   Type: ${validatedRequest.analysisType}`)
    console.log(`   Symbol: ${validatedRequest.symbol}`)
    console.log(`   Force Model: ${validatedRequest.forceModel || 'auto'}`)
    console.log(`   Max Tokens: ${validatedRequest.maxTokens}`)
    console.log(`   Temperature: ${validatedRequest.temperature}`)
    console.log(`   Real Time: ${validatedRequest.requiresRealTime}`)
    
    // Determine the best model for the analysis type
    let selectedModel;
    try {
      selectedModel = selectOptimalModel(validatedRequest.analysisType, validatedRequest.forceModel)
      console.log(`🤖 Selected AI model: ${selectedModel}`)
    } catch (modelError) {
      console.error('❌ Model selection error:', modelError.message)
      return new Response(
        JSON.stringify({ 
          error: 'Model selection failed',
          details: modelError.message 
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

    // Get API key for selected model with enhanced error handling
    console.log(`🔑 Getting API key for ${selectedModel}...`)
    let apiKey, keySource;
    try {
      const keyResult = getAPIKey(selectedModel)
      apiKey = keyResult.key
      keySource = keyResult.source
      
      // Validate API key format
      if (selectedModel === 'claude' && !apiKey.startsWith('sk-ant-')) {
        throw new Error(`Claude API key must start with 'sk-ant-' but got key starting with '${apiKey.substring(0, 7)}...'`);
      }
      
      console.log(`✅ Using ${selectedModel} API key from ${keySource} (length: ${apiKey.length})`)
    } catch (keyError) {
      console.error(`❌ API key error for ${selectedModel}:`, keyError.message)
      return new Response(
        JSON.stringify({ 
          error: `${selectedModel.toUpperCase()} API key not configured or invalid`,
          details: `Please add a valid ${selectedModel.toUpperCase()} API key to Supabase Edge Function Secrets. Go to Project Settings > Edge Functions > Secrets and add ${keySource}.`,
          model: selectedModel,
          keyName: keySource,
          suggestion: selectedModel === 'claude' ? 'API key must start with sk-ant-' : 'Please verify your API key format'
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

    // Build context-aware prompt
    console.log('📝 Building analysis prompt...')
    let contextPrompt;
    try {
      contextPrompt = buildContextPrompt(validatedRequest.analysisType, validatedRequest.symbol, validatedRequest.data)
      console.log(`✅ Prompt built (${contextPrompt.length} characters)`)
      
      if (contextPrompt.length > 10000) {
        console.log('⚠️ Large prompt detected, truncating...')
        contextPrompt = contextPrompt.substring(0, 10000) + '...'
      }
    } catch (promptError) {
      console.error('❌ Prompt building error:', promptError.message)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to build analysis prompt',
          details: promptError.message 
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
    
    let analysis = ''
    let confidence = 0.7
    
    // Call the appropriate AI service with timeout protection
    console.log(`🚀 Calling ${selectedModel} API...`)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ ${selectedModel} API call timeout after 30 seconds`);
        controller.abort();
      }, 30000); // 30 second timeout

      let result;
      if (selectedModel === 'perplexity') {
        result = await callPerplexityAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
      } else if (selectedModel === 'openai') {
        result = await callOpenAIAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
      } else {
        console.log('🧠 Calling Claude API...')
        result = await callClaudeAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
        console.log('✅ Claude API call completed successfully')
      }
      
      clearTimeout(timeoutId);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from AI service - no result object');
      }
      
      analysis = result.content || '';
      confidence = result.confidence || 0.7;
      
      console.log(`✅ ${selectedModel} analysis completed (${analysis.length} characters, confidence: ${confidence})`);
    } catch (aiError) {
      console.error(`❌ ${selectedModel} AI service error:`)
      console.error('Error name:', aiError.name)
      console.error('Error message:', aiError.message)
      console.error('Error stack:', aiError.stack)
      
      // Enhanced error messages based on error type
      let errorMessage = aiError.message || 'Unknown AI service error';
      let suggestion = 'Please check your API configuration';
      
      if (selectedModel === 'claude') {
        if (aiError.message?.includes('authentication') || aiError.message?.includes('401')) {
          errorMessage = 'Claude API key is invalid or expired. Please update your ANTHROPIC_API_KEY in Supabase Edge Function Secrets with a valid Anthropic API key.';
          suggestion = 'Get a valid API key from https://console.anthropic.com/';
        } else if (aiError.message?.includes('rate limit') || aiError.message?.includes('429')) {
          errorMessage = 'Claude API rate limit exceeded. Please try again in a few minutes.';
          suggestion = 'Wait before making another request';
        } else if (aiError.name === 'AbortError') {
          errorMessage = 'Claude API request timed out after 30 seconds.';
          suggestion = 'Try again with a simpler request';
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to get analysis from ${selectedModel}`,
          details: errorMessage,
          model: selectedModel,
          errorType: aiError.name || 'Unknown',
          suggestion: suggestion
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

    // Validate AI response
    console.log('🔍 Validating AI response...')
    if (!analysis || typeof analysis !== 'string' || analysis.trim().length === 0) {
      console.error('❌ Empty or invalid analysis received from AI model')
      return new Response(
        JSON.stringify({ 
          error: 'Empty or invalid response from AI model',
          model: selectedModel,
          details: 'The AI service returned an empty or invalid response'
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
      content: analysis.trim(),
      model: selectedModel,
      confidence: Math.max(0, Math.min(1, confidence)), // Ensure confidence is between 0 and 1
      timestamp: new Date().toISOString(),
      metadata: {
        analysisType: validatedRequest.analysisType,
        symbol: validatedRequest.symbol,
        tokenCount: analysis.length,
        modelUsed: selectedModel,
        processingTime: Date.now()
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
    console.error('   Error type:', error?.constructor?.name || 'Unknown')
    console.error('   Error message:', error?.message || 'No message')
    console.error('   Error stack:', error?.stack || 'No stack trace')
    console.error('⏰ Error occurred at:', new Date().toISOString())
    
    return new Response(
      JSON.stringify({ 
        error: 'Critical failure in AI analysis function',
        details: error?.message || 'Unknown internal server error',
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name || 'Unknown'
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
