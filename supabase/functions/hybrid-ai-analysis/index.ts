
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './utils/config.ts';
import { validateAndParseRequest, createErrorResponse, createSuccessResponse } from './utils/requestHandler.ts';
import { selectOptimalProvider } from './utils/config.ts';
import { generatePrompt } from './utils/prompts.ts';
import { callOpenAI } from './providers/openai.ts';
import { callClaude } from './providers/claude.ts';
import { callPerplexity } from './providers/perplexity.ts';

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`🚀 [${requestId}] === HYBRID AI ANALYSIS REQUEST START ===`);
  console.log(`📥 [${requestId}] Request details:`, {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      console.log(`✅ [${requestId}] Handling CORS preflight`);
      return new Response('ok', { headers: corsHeaders });
    }

    // Validate and parse request
    const validation = await validateAndParseRequest(req);
    
    if (!validation.isValid) {
      if (validation.error === 'OPTIONS_REQUEST') {
        return new Response('ok', { headers: corsHeaders });
      }
      console.error(`❌ [${requestId}] Request validation failed:`, validation.error);
      return createErrorResponse(validation.error);
    }

    const { analysisType, symbol, data, requiresRealTime, forceModel, maxTokens = 2000, temperature = 0.3 } = validation.data;

    console.log(`📊 [${requestId}] Processing analysis:`, {
      analysisType,
      symbol,
      requiresRealTime,
      forceModel,
      maxTokens,
      temperature,
      dataSize: JSON.stringify(data).length
    });

    // Select optimal AI provider
    const selectedProvider = selectOptimalProvider(analysisType, requiresRealTime, forceModel);
    console.log(`🤖 [${requestId}] Selected provider:`, selectedProvider);

    // Generate analysis prompt
    const prompt = generatePrompt(analysisType, symbol, data);
    console.log(`📝 [${requestId}] Generated prompt length:`, prompt.length);

    let result;
    const startTime = performance.now();

    try {
      // Call the selected AI provider
      switch (selectedProvider.name) {
        case 'claude':
          result = await callClaude(prompt, {
            maxTokens,
            temperature,
            model: selectedProvider.model
          });
          break;
        case 'openai':
          result = await callOpenAI(prompt, {
            maxTokens,
            temperature,
            model: selectedProvider.model
          });
          break;
        case 'perplexity':
          result = await callPerplexity(prompt, {
            maxTokens,
            temperature,
            model: selectedProvider.model
          });
          break;
        default:
          throw new Error(`Unsupported provider: ${selectedProvider.name}`);
      }

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      console.log(`✅ [${requestId}] Analysis completed:`, {
        provider: selectedProvider.name,
        model: selectedProvider.model,
        processingTime: `${processingTime}ms`,
        contentLength: result.content?.length || 0,
        confidence: selectedProvider.confidence
      });

      const response = {
        content: result.content,
        model: `${selectedProvider.name}/${selectedProvider.model}`,
        confidence: selectedProvider.confidence,
        processingTime,
        metadata: {
          provider: selectedProvider.name,
          analysisType,
          symbol,
          requestId,
          ...result.metadata
        }
      };

      console.log(`🏁 [${requestId}] === HYBRID AI ANALYSIS REQUEST END ===`);
      return createSuccessResponse(response);

    } catch (providerError) {
      console.error(`❌ [${requestId}] Provider error:`, {
        provider: selectedProvider.name,
        error: providerError.message,
        stack: providerError.stack
      });

      // Try fallback provider if available
      const fallbackProvider = selectOptimalProvider(analysisType, requiresRealTime, undefined, [selectedProvider.name]);
      
      if (fallbackProvider.name !== selectedProvider.name) {
        console.log(`🔄 [${requestId}] Trying fallback provider:`, fallbackProvider.name);
        
        try {
          switch (fallbackProvider.name) {
            case 'claude':
              result = await callClaude(prompt, {
                maxTokens,
                temperature,
                model: fallbackProvider.model
              });
              break;
            case 'openai':
              result = await callOpenAI(prompt, {
                maxTokens,
                temperature,
                model: fallbackProvider.model
              });
              break;
            case 'perplexity':
              result = await callPerplexity(prompt, {
                maxTokens,
                temperature,
                model: fallbackProvider.model
              });
              break;
          }

          const endTime = performance.now();
          const processingTime = Math.round(endTime - startTime);

          console.log(`✅ [${requestId}] Fallback analysis completed:`, {
            provider: fallbackProvider.name,
            model: fallbackProvider.model,
            processingTime: `${processingTime}ms`,
            contentLength: result.content?.length || 0
          });

          const response = {
            content: result.content,
            model: `${fallbackProvider.name}/${fallbackProvider.model}`,
            confidence: fallbackProvider.confidence * 0.9, // Slightly lower confidence for fallback
            processingTime,
            metadata: {
              provider: fallbackProvider.name,
              analysisType,
              symbol,
              requestId,
              fallbackUsed: true,
              originalProvider: selectedProvider.name,
              ...result.metadata
            }
          };

          console.log(`🏁 [${requestId}] === HYBRID AI ANALYSIS REQUEST END (FALLBACK) ===`);
          return createSuccessResponse(response);

        } catch (fallbackError) {
          console.error(`❌ [${requestId}] Fallback provider also failed:`, fallbackError.message);
          throw new Error(`Both primary (${selectedProvider.name}) and fallback (${fallbackProvider.name}) providers failed`);
        }
      } else {
        throw providerError;
      }
    }

  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    console.log(`🏁 [${requestId}] === HYBRID AI ANALYSIS REQUEST END (ERROR) ===`);
    return createErrorResponse(
      `Analysis failed: ${error.message}`,
      500
    );
  }
});
