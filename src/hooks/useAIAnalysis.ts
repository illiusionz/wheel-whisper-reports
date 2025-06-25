
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRateLimitedAPI } from '@/hooks/useRateLimitedAPI';
import { useToast } from '@/hooks/use-toast';

export interface AIAnalysis {
  symbol: string;
  analysisType: string;
  analysis: string;
  timestamp: string;
}

export const useAIAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const rateLimiter = useRateLimitedAPI<AIAnalysis>({
    maxCallsPerMinute: 10, // Conservative limit for AI analysis
    cacheTTL: 300000, // 5 minutes cache
    debounceMs: 1000 // 1 second debounce
  });

  const getAIAnalysis = async (
    symbol: string, 
    analysisType: 'technical' | 'options' | 'risk' | 'general',
    data: any
  ): Promise<AIAnalysis | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const cacheKey = `${symbol}-${analysisType}-${JSON.stringify(data).slice(0, 100)}`;
      
      const result = await rateLimiter.debouncedCall(
        cacheKey,
        async () => {
          const { data: result, error: apiError } = await supabase.functions.invoke('ai-analysis', {
            body: { symbol, analysisType, data }
          });

          if (apiError) throw apiError;
          return result;
        }
      );

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get AI analysis';
      setError(errorMsg);
      console.error('AI Analysis error:', err);
      
      if (errorMsg.includes('Rate limit')) {
        toast({
          title: "Rate Limited",
          description: "Too many AI requests. Please wait before trying again.",
          variant: "destructive",
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAIAnalysis,
    isLoading,
    error,
    remainingCalls: rateLimiter.getRemainingCalls(),
    canMakeCall: rateLimiter.canMakeCall(),
    isBlocked: rateLimiter.isBlocked
  };
};
