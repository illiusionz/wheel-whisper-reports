
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateAIAnalysisRequest, sanitizeSymbol } from '@/utils/validation';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';

export const useHybridAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Temporarily disable circuit breaker to isolate the issue
  const circuitBreaker = useCircuitBreaker({
    serviceName: 'hybrid-ai-analysis',
    failureThreshold: 10, // Increased threshold
    resetTimeout: 30000, // Reduced timeout
    showToastOnTrip: false // Disable toast to reduce noise
  });

  const getHybridAnalysis = async (
    analysisType: string,
    symbol: string,
    data: any,
    requiresRealTime: boolean = false,
    forceModel?: string
  ) => {
    console.log('🚀 === HYBRID AI ANALYSIS START ===');
    console.log('🎯 Request Details:', {
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
      // Validate and sanitize input
      console.log('✅ Validating request payload...');
      const requestPayload = validateAIAnalysisRequest({
        analysisType,
        symbol: sanitizeSymbol(symbol),
        data,
        requiresRealTime,
        forceModel,
        maxTokens: 2000,
        temperature: 0.3
      });
      
      console.log('✅ Validated payload:', {
        analysisType: requestPayload.analysisType,
        symbol: requestPayload.symbol,
        forceModel: requestPayload.forceModel,
        maxTokens: requestPayload.maxTokens,
        temperature: requestPayload.temperature
      });
      
      // Make direct call to Supabase function (bypass circuit breaker temporarily)
      console.log('🔄 Calling Supabase Edge Function directly...');
      const startTime = performance.now();
      
      const { data: result, error: functionError } = await supabase.functions.invoke('hybrid-ai-analysis', {
        body: requestPayload
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log('📊 Supabase Function Response:', {
        duration: `${duration}ms`,
        hasError: !!functionError,
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
        timestamp: new Date().toISOString()
      });

      if (functionError) {
        console.error('❌ Supabase Function Error:', {
          message: functionError.message,
          details: functionError.details,
          hint: functionError.hint,
          code: functionError.code,
          stack: functionError.stack
        });
        
        let errorMessage = 'Failed to get AI analysis';
        
        if (functionError.message?.includes('FunctionsFetchError')) {
          errorMessage = 'Connection to AI service failed. Please check your internet connection.';
        } else if (functionError.message?.includes('401') || functionError.message?.includes('unauthorized')) {
          errorMessage = 'API authentication failed. Please check your API key configuration.';
        } else if (functionError.details || functionError.message) {
          errorMessage = functionError.details || functionError.message;
        }
        
        setError(errorMessage);
        return null;
      }

      if (!result) {
        console.error('❌ No result from Edge Function');
        setError('No response received from AI service');
        return null;
      }

      // Enhanced result validation
      if (result.error) {
        console.error('❌ Error in result:', result.error);
        setError(result.error);
        return null;
      }

      if (!result.content || typeof result.content !== 'string' || result.content.trim().length === 0) {
        console.error('❌ Invalid or empty content:', {
          hasContent: !!result.content,
          contentType: typeof result.content,
          contentLength: result.content?.length || 0
        });
        setError('Invalid or empty analysis content received');
        return null;
      }

      console.log('✅ Analysis completed successfully:', {
        model: result.model,
        contentLength: result.content.length,
        confidence: result.confidence,
        processingTime: duration
      });

      const finalResult = {
        content: result.content.trim(),
        model: result.model || 'unknown',
        confidence: result.confidence || 0.7,
        timestamp: result.timestamp || new Date().toISOString(),
        analysisType: requestPayload.analysisType,
        symbol: requestPayload.symbol,
        metadata: {
          ...result.metadata,
          processingTime: duration
        }
      };
      
      setError(null);
      return finalResult;

    } catch (err: any) {
      console.error('💥 Catch Block Error:', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        cause: err?.cause,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = 'An unexpected error occurred';
      
      if (err.message?.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
      console.log('🏁 === HYBRID AI ANALYSIS END ===');
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
