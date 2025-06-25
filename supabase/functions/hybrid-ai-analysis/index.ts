
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

function validateHybridAIRequest(body: any) {
  console.log('🔍 VALIDATING REQUEST:', {
    hasBody: !!body,
    bodyType: typeof body,
    bodyKeys: Object.keys(body || {}),
    timestamp: new Date().toISOString()
  });
  
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body - must be a valid JSON object');
  }

  const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens, temperature } = body;

  const validAnalysisTypes = ['technical', 'options', 'risk', 'sentiment', 'news', 'general'];
  if (!analysisType || !validAnalysisTypes.includes(analysisType)) {
    throw new Error(`Invalid analysis type "${analysisType}". Must be one of: ${validAnalysisTypes.join(', ')}`);
  }

  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Symbol is required and must be a string');
  }
  
  const sanitizedSymbol = symbol.toUpperCase().trim().replace(/[^A-Z]/g, '');
  if (sanitizedSymbol.length === 0 || sanitizedSymbol.length > 10) {
    throw new Error('Symbol must be 1-10 uppercase letters');
  }

  const validModels = ['claude', 'openai', 'perplexity'];
  if (forceModel && !validModels.includes(forceModel)) {
    throw new Error(`Invalid force model "${forceModel}". Must be one of: ${validModels.join(', ')}`);
  }

  const validatedMaxTokens = maxTokens && typeof maxTokens === 'number' && maxTokens > 0 && maxTokens <= 4000 
    ? Math.floor(maxTokens) 
    : 2000;

  const validatedTemperature = temperature && typeof temperature === 'number' && temperature >= 0 && temperature <= 2
    ? temperature
    : 0.3;

  const validatedRequest = {
    analysisType,
    symbol: sanitizedSymbol,
    data: data || {},
    requiresRealTime: Boolean(requiresRealTime),
    forceModel: forceModel || undefined,
    maxTokens: validatedMaxTokens,
    temperature: validatedTemperature
  };

  console.log('✅ REQUEST VALIDATION SUCCESS:', validatedRequest);
  return validatedRequest;
}

console.log('🚀 HYBRID AI ANALYSIS FUNCTION STARTING...');

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`📨 [${requestId}] REQUEST RECEIVED:`, {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log(`✅ [${requestId}] CORS preflight handled`);
      return new Response('ok', { 
        headers: corsHeaders,
        status: 200 
      });
    }

    if (req.method !== 'POST') {
      console.log(`❌ [${requestId}] Invalid method: ${req.method}`);
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          requestId,
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
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log(`📄 [${requestId}] Raw body received:`, {
        length: bodyText.length,
        preview: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')
      });
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log(`✅ [${requestId}] Body parsed successfully`);
    } catch (parseError) {
      console.error(`❌ [${requestId}] JSON parse error:`, parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          requestId,
          details: parseError.message
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }
    
    // Validate request
    let validatedRequest;
    try {
      validatedRequest = validateHybridAIRequest(requestBody);
      console.log(`✅ [${requestId}] Request validated`);
    } catch (validationError) {
      console.error(`❌ [${requestId}] Validation error:`, validationError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Request validation failed',
          requestId,
          details: validationError.message 
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }
    
    console.log(`🎯 [${requestId}] Analysis Configuration:`, {
      analysisType: validatedRequest.analysisType,
      symbol: validatedRequest.symbol,
      forceModel: validatedRequest.forceModel || 'auto',
      maxTokens: validatedRequest.maxTokens,
      temperature: validatedRequest.temperature
    });
    
    // Select optimal model
    let selectedModel;
    try {
      selectedModel = selectOptimalModel(validatedRequest.analysisType, validatedRequest.forceModel);
      console.log(`🤖 [${requestId}] Selected model: ${selectedModel}`);
    } catch (modelError) {
      console.error(`❌ [${requestId}] Model selection error:`, modelError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Model selection failed',
          requestId,
          details: modelError.message 
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Get and validate API key
    console.log(`🔑 [${requestId}] Getting API key for ${selectedModel}...`);
    let apiKey, keySource;
    try {
      const keyResult = getAPIKey(selectedModel);
      apiKey = keyResult.key;
      keySource = keyResult.source;
      
      console.log(`✅ [${requestId}] API key obtained from ${keySource} (length: ${apiKey?.length || 0})`);
      
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        throw new Error(`${selectedModel.toUpperCase()} API key is empty or invalid`);
      }
      
      // Enhanced model-specific validation
      if (selectedModel === 'claude') {
        if (!apiKey.startsWith('sk-ant-')) {
          throw new Error(`Claude API key must start with 'sk-ant-', received: ${apiKey.substring(0, 10)}...`);
        }
        if (apiKey.length < 40) {
          throw new Error(`Claude API key appears too short (${apiKey.length} characters)`);
        }
      } else if (selectedModel === 'openai') {
        if (!apiKey.startsWith('sk-')) {
          throw new Error(`OpenAI API key must start with 'sk-', received: ${apiKey.substring(0, 10)}...`);
        }
      } else if (selectedModel === 'perplexity') {
        if (!apiKey.startsWith('pplx-')) {
          throw new Error(`Perplexity API key must start with 'pplx-', received: ${apiKey.substring(0, 10)}...`);
        }
      }
      
    } catch (keyError) {
      console.error(`❌ [${requestId}] API key error:`, keyError.message);
      return new Response(
        JSON.stringify({ 
          error: `${selectedModel.toUpperCase()} API key configuration error`,
          requestId,
          details: keyError.message,
          suggestion: `Please add a valid ${selectedModel.toUpperCase()}_API_KEY to Supabase Edge Function Secrets`
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Build analysis prompt
    console.log(`📝 [${requestId}] Building analysis prompt...`);
    let contextPrompt;
    try {
      contextPrompt = buildContextPrompt(validatedRequest.analysisType, validatedRequest.symbol, validatedRequest.data);
      console.log(`✅ [${requestId}] Prompt built (${contextPrompt.length} characters)`);
      
      // Truncate overly long prompts
      if (contextPrompt.length > 15000) {
        contextPrompt = contextPrompt.substring(0, 15000) + '\n\n[Content truncated for processing]';
        console.log(`⚠️ [${requestId}] Prompt truncated to ${contextPrompt.length} characters`);
      }
    } catch (promptError) {
      console.error(`❌ [${requestId}] Prompt building error:`, promptError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to build analysis prompt',
          requestId,
          details: promptError.message 
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }
    
    // Call AI service with enhanced error handling
    console.log(`🚀 [${requestId}] Calling ${selectedModel} API...`);
    const aiStartTime = Date.now();
    
    let analysis = '';
    let confidence = 0.7;
    
    try {
      let result;
      
      // Enhanced timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [${requestId}] AI service timeout after 60 seconds`);
        controller.abort();
      }, 60000);
      
      try {
        if (selectedModel === 'perplexity') {
          result = await callPerplexityAPI(apiKey, contextPrompt, validatedRequest.maxTokens);
        } else if (selectedModel === 'openai') {
          result = await callOpenAIAPI(apiKey, contextPrompt, validatedRequest.maxTokens);
        } else {
          result = await callClaudeAPI(apiKey, contextPrompt, validatedRequest.maxTokens);
        }
      } finally {
        clearTimeout(timeoutId);
      }
      
      const aiProcessingTime = Date.now() - aiStartTime;
      console.log(`⏱️ [${requestId}] AI processing completed in ${aiProcessingTime}ms`);
      
      if (!result || typeof result !== 'object') {
        throw new Error(`Invalid response structure from ${selectedModel} API`);
      }
      
      analysis = result.content || '';
      confidence = result.confidence || 0.7;
      
      console.log(`✅ [${requestId}] Analysis completed:`, {
        contentLength: analysis.length,
        confidence: confidence,
        processingTime: aiProcessingTime,
        contentPreview: analysis.substring(0, 100) + (analysis.length > 100 ? '...' : '')
      });
      
      if (!analysis || analysis.trim().length === 0) {
        throw new Error(`${selectedModel} returned empty analysis content`);
      }
      
    } catch (aiError) {
      console.error(`❌ [${requestId}] AI service error:`, {
        name: aiError.name,
        message: aiError.message,
        stack: aiError.stack?.substring(0, 500)
      });
      
      let errorMessage = aiError.message || 'Unknown AI service error';
      let suggestion = 'Please check your API configuration and try again';
      
      if (aiError.message?.includes('authentication') || aiError.message?.includes('401')) {
        errorMessage = `${selectedModel} API authentication failed`;
        suggestion = `Please verify your ${selectedModel.toUpperCase()}_API_KEY in Supabase Edge Function Secrets`;
      } else if (aiError.message?.includes('rate limit') || aiError.message?.includes('429')) {
        errorMessage = `${selectedModel} API rate limit exceeded`;
        suggestion = 'Wait before making another request or upgrade your API plan';
      } else if (aiError.name === 'AbortError') {
        errorMessage = `${selectedModel} API request timed out`;
        suggestion = 'Try again with a simpler request or check service status';
      } else if (aiError.message?.includes('fetch') || aiError.message?.includes('network')) {
        errorMessage = `Network error connecting to ${selectedModel} API`;
        suggestion = 'Check your internet connection and try again';
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to get analysis from ${selectedModel}`,
          requestId,
          details: errorMessage,
          suggestion: suggestion
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Final validation and response preparation
    if (!analysis || typeof analysis !== 'string' || analysis.trim().length === 0) {
      console.error(`❌ [${requestId}] Empty or invalid analysis after processing`);
      return new Response(
        JSON.stringify({ 
          error: 'Empty or invalid response from AI model',
          requestId,
          model: selectedModel,
          details: 'The AI model returned no usable content'
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    const totalProcessingTime = Date.now() - startTime;
    const response = {
      content: analysis.trim(),
      model: selectedModel,
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: new Date().toISOString(),
      metadata: {
        requestId,
        analysisType: validatedRequest.analysisType,
        symbol: validatedRequest.symbol,
        tokenCount: analysis.length,
        processingTime: totalProcessingTime,
        apiKeySource: keySource,
        promptLength: contextPrompt.length
      }
    };

    console.log(`🎉 [${requestId}] SUCCESS - Analysis completed:`, {
      contentLength: response.content.length,
      model: response.model,
      confidence: response.confidence,
      processingTime: totalProcessingTime
    });

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`💥 [${requestId}] CRITICAL ERROR:`, {
      name: error?.constructor?.name || 'Unknown',
      message: error?.message || 'No message',
      stack: error?.stack?.substring(0, 500) || 'No stack',
      processingTime: totalTime
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Critical failure in AI analysis function',
        requestId,
        details: error?.message || 'Unknown internal server error',
        timestamp: new Date().toISOString(),
        processingTime: totalTime
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

console.log('🎯 HYBRID AI ANALYSIS FUNCTION READY');
