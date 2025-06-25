
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRateLimitedAPI } from '@/hooks/useRateLimitedAPI';
import { useToast } from '@/hooks/use-toast';

export interface HybridAIResponse {
  content: string;
  model: 'claude' | 'openai' | 'perplexity';
  confidence: number;
  timestamp: string;
}

export const useHybridAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const rateLimiter = useRateLimitedAPI<HybridAIResponse>({
    maxCallsPerMinute: 15, // Higher limit for hybrid system
    cacheTTL: 300000, // 5 minutes cache
    debounceMs: 1000
  });

  const getOptimalModel = (analysisType: string, requiresRealTime: boolean = false) => {
    // Perplexity for real-time data needs
    if (requiresRealTime || analysisType.includes('news') || analysisType.includes('sentiment')) {
      return 'perplexity';
    }
    
    // Claude for sophisticated financial analysis
    if (['technical', 'risk', 'strategy', 'options'].some(type => analysisType.includes(type))) {
      return 'claude';
    }
    
    // OpenAI for general analysis and chat
    return 'openai';
  };

  const getHybridAnalysis = async (
    analysisType: 'technical' | 'options' | 'risk' | 'general' | 'news' | 'sentiment',
    symbol: string,
    data: any,
    requiresRealTime: boolean = false
  ): Promise<HybridAIResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const optimalModel = getOptimalModel(analysisType, requiresRealTime);
      const cacheKey = `hybrid-${symbol}-${analysisType}-${optimalModel}-${JSON.stringify(data).slice(0, 100)}`;
      
      const result = await rateLimiter.debouncedCall(
        cacheKey,
        async () => {
          const { data: result, error: apiError } = await supabase.functions.invoke('hybrid-ai-analysis', {
            body: { 
              analysisType, 
              symbol, 
              data, 
              preferredModel: optimalModel,
              requiresRealTime 
            }
          });

          if (apiError) throw apiError;
          return result;
        }
      );

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get hybrid AI analysis';
      setError(errorMsg);
      console.error('Hybrid AI Analysis error:', err);
      
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
    getHybridAnalysis,
    isLoading,
    error,
    remainingCalls: rateLimiter.getRemainingCalls(),
    canMakeCall: rateLimiter.canMakeCall(),
  };
};
