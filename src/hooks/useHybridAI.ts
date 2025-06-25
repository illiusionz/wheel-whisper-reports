
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateAIAnalysisRequest, sanitizeSymbol } from '@/utils/validation';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';

export const useHybridAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const circuitBreaker = useCircuitBreaker({
    serviceName: 'hybrid-ai-analysis',
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute for AI services
    showToastOnTrip: true
  });

  const getHybridAnalysis = async (
    analysisType: string,
    symbol: string,
    data: any,
    requiresRealTime: boolean = false,
    forceModel?: string
  ) => {
    console.log('=== HYBRID AI HOOK START ===')
    console.log('Input parameters:', { analysisType, symbol, data, requiresRealTime, forceModel });
    
    setIsLoading(true);
    setError(null);

    // Check if service is available
    if (!circuitBreaker.isAvailable) {
      const errorMessage = `AI analysis service is temporarily unavailable. Please try again in a moment.`;
      console.log('Circuit breaker not available:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }

    try {
      // Validate and sanitize input
      console.log('Validating request...');
      const requestPayload = validateAIAnalysisRequest({
        analysisType,
        symbol: sanitizeSymbol(symbol),
        data,
        requiresRealTime,
        forceModel,
        maxTokens: 2000,
        temperature: 0.3
      });
      
      console.log('✅ Validated request payload:', JSON.stringify(requestPayload, null, 2));
      
      // Execute through circuit breaker
      console.log('🚀 Calling Supabase Edge Function...');
      const result = await circuitBreaker.execute(async () => {
        console.log('Making supabase.functions.invoke call...');
        
        const { data: result, error: functionError } = await supabase.functions.invoke('hybrid-ai-analysis', {
          body: requestPayload
        });

        console.log('=== SUPABASE FUNCTION RESPONSE ===')
        console.log('Function error:', functionError)
        console.log('Function result:', result)
        console.log('Result type:', typeof result)
        console.log('Result keys:', result ? Object.keys(result) : 'N/A')
        
        if (functionError) {
          console.error('=== FUNCTION ERROR DETAILS ===')
          console.error('Error type:', typeof functionError)
          console.error('Error object:', functionError)
          console.error('Error message:', functionError.message)
          console.error('Error details:', functionError.details)
          console.error('Error hint:', functionError.hint)
          console.error('Error code:', functionError.code)
          console.error('=== END FUNCTION ERROR ===')
          
          // Handle specific error types
          if (functionError.message?.includes('FunctionsFetchError')) {
            throw new Error('Edge Function connection failed. Please check your network connection and try again.');
          }
          
          if (functionError.message?.includes('401') || functionError.message?.includes('unauthorized')) {
            throw new Error('Authentication failed. Please check your API keys in Supabase Edge Function Secrets.');
          }
          
          const errorMessage = functionError.message || functionError.details || 'Failed to get AI analysis';
          throw new Error(errorMessage);
        }

        if (!result) {
          console.error('=== NO RESULT FROM FUNCTION ===')
          throw new Error('No analysis result received from the Edge Function');
        }

        // Check if the result contains an error
        if (result.error) {
          console.error('=== RESULT CONTAINS ERROR ===')
          console.error('Error in result:', result.error)
          console.error('Error details:', result.details)
          throw new Error(result.error + (result.details ? `: ${result.details}` : ''));
        }

        // Validate result structure
        if (!result.content || typeof result.content !== 'string') {
          console.error('=== INVALID RESULT STRUCTURE ===')
          console.error('Result content:', result.content)
          console.error('Content type:', typeof result.content)
          throw new Error('Invalid response format from AI service');
        }

        return result;
      });

      console.log(`✅ Hybrid AI analysis completed for ${requestPayload.symbol}:`, {
        model: result.model,
        contentLength: result.content?.length || 0,
        confidence: result.confidence,
        timestamp: result.timestamp
      });

      setError(null);
      
      const finalResult = {
        content: result.content || 'Analysis completed but no content received.',
        model: result.model || 'unknown',
        confidence: result.confidence || 0.7,
        timestamp: result.timestamp || new Date().toISOString(),
        analysisType: requestPayload.analysisType,
        symbol: requestPayload.symbol,
        metadata: result.metadata || {}
      };
      
      console.log('=== HYBRID AI HOOK END SUCCESS ===')
      console.log('Final result:', finalResult);
      
      return finalResult;

    } catch (err: any) {
      console.error('=== HOOK CATCH ERROR ===')
      console.error('Error type:', typeof err)
      console.error('Error constructor:', err.constructor.name)
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
      console.error('Full error object:', err)
      console.error('=== END HOOK ERROR ===')
      
      let errorMessage = 'Failed to get AI analysis';
      
      if (err.message?.includes('FunctionsFetchError')) {
        errorMessage = 'Connection to AI service failed. Please check your internet connection and try again.';
      } else if (err.message?.includes('401') || err.message?.includes('authentication')) {
        errorMessage = 'API authentication failed. Please check your API keys in Supabase Edge Function Secrets.';
      } else if (err.message?.includes('API key')) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
