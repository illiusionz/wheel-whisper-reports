
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
    
    setIsLoading(true);
    setError(null);

    // Check if service is available
    if (!circuitBreaker.isAvailable) {
      const errorMessage = `AI analysis service is temporarily unavailable. Please try again in a moment.`;
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }

    try {
      // Validate and sanitize input
      const requestPayload = validateAIAnalysisRequest({
        analysisType,
        symbol: sanitizeSymbol(symbol),
        data,
        requiresRealTime,
        forceModel,
        maxTokens: 2000,
        temperature: 0.3
      });
      
      console.log('Validated request payload:', JSON.stringify(requestPayload, null, 2));
      
      // Execute through circuit breaker
      const result = await circuitBreaker.execute(async () => {
        const { data: result, error: functionError } = await supabase.functions.invoke('hybrid-ai-analysis', {
          body: requestPayload
        });

        console.log('=== SUPABASE FUNCTION RESPONSE ===')
        console.log('Function error:', functionError)
        console.log('Function result:', result)
        
        if (functionError) {
          console.error('=== FUNCTION ERROR DETAILS ===')
          console.error('Error type:', typeof functionError)
          console.error('Error object:', functionError)
          console.error('Error message:', functionError.message)
          console.error('Error details:', functionError.details)
          console.error('Error hint:', functionError.hint)
          console.error('Error code:', functionError.code)
          console.error('=== END FUNCTION ERROR ===')
          
          const errorMessage = functionError.message || 'Failed to get AI analysis';
          throw new Error(errorMessage);
        }

        if (!result) {
          console.error('=== NO RESULT FROM FUNCTION ===')
          throw new Error('No analysis result received');
        }

        // Check if the result contains an error
        if (result.error) {
          console.error('=== RESULT CONTAINS ERROR ===')
          console.error('Error in result:', result.error)
          throw new Error(result.error);
        }

        return result;
      });

      console.log(`Hybrid AI analysis completed for ${requestPayload.symbol}:`, {
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
      
      console.log('=== HYBRID AI HOOK END ===')
      
      return finalResult;

    } catch (err: any) {
      console.error('=== HOOK CATCH ERROR ===')
      console.error('Error type:', typeof err)
      console.error('Error constructor:', err.constructor.name)
      console.error('Error message:', err.message)
      console.error('Full error object:', err)
      console.error('=== END HOOK ERROR ===')
      
      const errorMessage = err.message || 'Failed to get AI analysis';
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
