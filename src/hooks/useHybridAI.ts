
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateAIAnalysisRequest, sanitizeSymbol } from '@/utils/validation';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';

export const useHybridAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const circuitBreaker = useCircuitBreaker({
    serviceName: 'hybrid-ai-analysis',
    failureThreshold: 5,
    resetTimeout: 60000,
    showToastOnTrip: false
  });

  const getHybridAnalysis = async (
    analysisType: string,
    symbol: string,
    data: any,
    requiresRealTime: boolean = false,
    forceModel?: string
  ) => {
    const requestId = crypto.randomUUID();
    console.log(`🚀 [${requestId}] === HYBRID AI ANALYSIS START ===`);
    console.log(`🎯 [${requestId}] Request Details:`, {
      analysisType,
      symbol,
      dataKeys: Object.keys(data || {}),
      requiresRealTime,
      forceModel,
      timestamp: new Date().toISOString()
    });
    
    setIsLoading(true);
    setError(null);

    try {
      // Enhanced input validation
      console.log(`✅ [${requestId}] Validating request payload...`);
      const requestPayload = validateAIAnalysisRequest({
        analysisType,
        symbol: sanitizeSymbol(symbol),
        data,
        requiresRealTime,
        forceModel,
        maxTokens: 2000,
        temperature: 0.3
      });
      
      console.log(`✅ [${requestId}] Validated payload:`, {
        analysisType: requestPayload.analysisType,
        symbol: requestPayload.symbol,
        forceModel: requestPayload.forceModel,
        dataSize: JSON.stringify(requestPayload.data).length
      });
      
      // Use circuit breaker to execute the request
      const result = await circuitBreaker.execute(async () => {
        const startTime = performance.now();
        
        console.log(`📡 [${requestId}] Invoking Supabase Edge Function...`);
        const { data: result, error: functionError } = await supabase.functions.invoke('hybrid-ai-analysis', {
          body: requestPayload,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log(`📊 [${requestId}] Supabase Function Response:`, {
          duration: `${duration}ms`,
          hasError: !!functionError,
          hasResult: !!result,
          resultType: typeof result,
          errorDetails: functionError
        });

        if (functionError) {
          console.error(`❌ [${requestId}] Supabase Function Error:`, functionError);
          
          let errorMessage = 'Failed to get AI analysis';
          
          if (functionError.message?.includes('FunctionsFetchError')) {
            errorMessage = 'Unable to connect to AI analysis service. Please check your connection and try again.';
          } else if (functionError.message?.includes('Function returned an error')) {
            errorMessage = functionError.details || 'AI analysis service returned an error. Please try again.';
          } else if (functionError.message?.includes('401') || functionError.message?.includes('unauthorized')) {
            errorMessage = 'API authentication failed. Please check your API key configuration.';
          } else if (functionError.message?.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again with a simpler request.';
          } else if (functionError.details || functionError.message) {
            errorMessage = functionError.details || functionError.message;
          }
          
          throw new Error(errorMessage);
        }

        if (!result) {
          console.error(`❌ [${requestId}] No result from Edge Function`);
          throw new Error('No response received from AI analysis service');
        }

        // Handle error responses from the edge function
        if (result.error) {
          console.error(`❌ [${requestId}] Error in result:`, result.error);
          throw new Error(result.error);
        }

        if (!result.content || typeof result.content !== 'string' || result.content.trim().length === 0) {
          console.error(`❌ [${requestId}] Invalid or empty content:`, {
            hasContent: !!result.content,
            contentType: typeof result.content,
            contentLength: result.content?.length || 0
          });
          throw new Error('Invalid or empty analysis content received');
        }

        console.log(`✅ [${requestId}] Analysis completed successfully:`, {
          model: result.model,
          contentLength: result.content.length,
          confidence: result.confidence,
          processingTime: duration
        });

        return {
          content: result.content.trim(),
          model: result.model || 'unknown',
          confidence: result.confidence || 0.7,
          timestamp: result.timestamp || new Date().toISOString(),
          analysisType: requestPayload.analysisType,
          symbol: requestPayload.symbol,
          metadata: {
            ...result.metadata,
            processingTime: duration,
            requestId
          }
        };
      });

      setError(null);
      console.log(`🏁 [${requestId}] === HYBRID AI ANALYSIS END ===`);
      return result;

    } catch (err: any) {
      console.error(`💥 [${requestId}] Catch Block Error:`, {
        name: err?.name,
        message: err?.message,
        stack: err?.stack
      });
      
      let errorMessage = 'An unexpected error occurred during AI analysis';
      
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (err.message?.includes('timeout') || err.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message?.includes('FunctionsFetchError')) {
        errorMessage = 'Unable to connect to AI analysis service. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.log(`🏁 [${requestId}] === HYBRID AI ANALYSIS END (ERROR) ===`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getHybridAnalysis,
    isLoading,
    error,
    circuitBreakerStats: circuitBreaker.stats,
    isServiceAvailable: circuitBreaker.isAvailable,
    resetCircuitBreaker: circuitBreaker.reset
  };
};
