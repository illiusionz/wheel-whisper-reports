
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
  console.log('🔑 Headers:', Object.fromEntries(req.headers.entries()))

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
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request body parsing timeout');
        controller.abort();
      }, 10000); // 10 second timeout
      
      const bodyText = await req.text();
      clearTimeout(timeoutId);
      
      console.log('📄 Raw request body length:', bodyText.length);
      console.log('📄 Raw request body preview:', bodyText.substring(0, 500));
      
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
      console.log('✅ Request validation successful:', validatedRequest);
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
      
      console.log(`✅ Got API key from ${keySource} (length: ${apiKey?.length || 0})`);
      
      // Enhanced API key validation
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        throw new Error(`${selectedModel.toUpperCase()} API key is empty or invalid`);
      }
      
      // Model-specific key format validation
      if (selectedModel === 'claude') {
        if (!apiKey.startsWith('sk-ant-')) {
          throw new Error(`Claude API key must start with 'sk-ant-' but got key starting with '${apiKey.substring(0, 10)}...'`);
        }
        if (apiKey.length < 40) {
          throw new Error(`Claude API key appears to be too short (${apiKey.length} characters)`);
        }
      } else if (selectedModel === 'openai') {
        if (!apiKey.startsWith('sk-')) {
          throw new Error(`OpenAI API key must start with 'sk-' but got key starting with '${apiKey.substring(0, 10)}...'`);
        }
      } else if (selectedModel === 'perplexity') {
        if (!apiKey.startsWith('pplx-')) {
          throw new Error(`Perplexity API key must start with 'pplx-' but got key starting with '${apiKey.substring(0, 10)}...'`);
        }
      }
      
      console.log(`✅ API key validation passed for ${selectedModel}`);
    } catch (keyError) {
      console.error(`❌ API key error for ${selectedModel}:`, keyError.message)
      return new Response(
        JSON.stringify({ 
          error: `${selectedModel.toUpperCase()} API key not configured or invalid`,
          details: keyError.message,
          model: selectedModel,
          keyName: keySource,
          suggestion: `Please add a valid ${selectedModel.toUpperCase()} API key to Supabase Edge Function Secrets. Go to Project Settings > Edge Functions > Secrets and add ${keySource}.`
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
      console.log(`📝 Prompt preview:`, contextPrompt.substring(0, 300) + '...')
      
      if (contextPrompt.length > 15000) {
        console.log('⚠️ Large prompt detected, truncating...')
        contextPrompt = contextPrompt.substring(0, 15000) + '\n\n[Content truncated for processing]'
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
    const startTime = Date.now();
    
    try {
      let result;
      if (selectedModel === 'perplexity') {
        console.log('🌐 Using Perplexity API...')
        result = await callPerplexityAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
      } else if (selectedModel === 'openai') {
        console.log('🤖 Using OpenAI API...')
        result = await callOpenAIAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
      } else {
        console.log('🧠 Using Claude API...')
        result = await callClaudeAPI(apiKey, contextPrompt, validatedRequest.maxTokens)
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ AI processing completed in ${processingTime}ms`);
      
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid result from AI service:', result);
        throw new Error('Invalid response from AI service - no result object');
      }
      
      analysis = result.content || '';
      confidence = result.confidence || 0.7;
      
      console.log(`✅ ${selectedModel} analysis completed:`, {
        contentLength: analysis.length,
        confidence: confidence,
        processingTime: processingTime
      });
      
      if (!analysis || analysis.trim().length === 0) {
        throw new Error(`${selectedModel} returned empty analysis content`);
      }
      
    } catch (aiError) {
      console.error(`❌ ${selectedModel} AI service error:`)
      console.error('Error name:', aiError.name)
      console.error('Error message:', aiError.message)
      console.error('Error stack:', aiError.stack)
      
      // Enhanced error messages based on error type and model
      let errorMessage = aiError.message || 'Unknown AI service error';
      let suggestion = 'Please check your API configuration and try again';
      
      if (selectedModel === 'claude') {
        if (aiError.message?.includes('authentication') || aiError.message?.includes('401')) {
          errorMessage = 'Claude API authentication failed. The API key is invalid, expired, or has insufficient permissions.';
          suggestion = 'Please update your ANTHROPIC_API_KEY in Supabase Edge Function Secrets with a valid key from https://console.anthropic.com/';
        } else if (aiError.message?.includes('rate limit') || aiError.message?.includes('429')) {
          errorMessage = 'Claude API rate limit exceeded. Please try again in a few minutes.';
          suggestion = 'Wait before making another request or upgrade your API plan';
        } else if (aiError.name === 'AbortError') {
          errorMessage = 'Claude API request timed out. The request took too long to process.';
          suggestion = 'Try again with a simpler request or check your internet connection';
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to get analysis from ${selectedModel}`,
          details: errorMessage,
          model: selectedModel,
          errorType: aiError.name || 'Unknown',
          suggestion: suggestion,
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

    // Final validation of AI response
    console.log('🔍 Validating AI response...')
    if (!analysis || typeof analysis !== 'string' || analysis.trim().length === 0) {
      console.error('❌ Empty or invalid analysis received from AI model')
      return new Response(
        JSON.stringify({ 
          error: 'Empty or invalid response from AI model',
          model: selectedModel,
          details: 'The AI service returned an empty or invalid response',
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

    const totalProcessingTime = Date.now() - startTime;
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
        processingTime: totalProcessingTime,
        apiKeySource: keySource
      }
    }

    console.log('🎉 SUCCESS - Returning analysis response')
    console.log(`   Content length: ${response.content.length}`)
    console.log(`   Model: ${response.model}`)
    console.log(`   Confidence: ${response.confidence}`)
    console.log(`   Processing time: ${totalProcessingTime}ms`)
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
