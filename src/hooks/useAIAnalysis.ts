
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIAnalysis {
  symbol: string;
  analysisType: string;
  analysis: string;
  timestamp: string;
}

export const useAIAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAIAnalysis = async (
    symbol: string, 
    analysisType: 'technical' | 'options' | 'risk' | 'general',
    data: any
  ): Promise<AIAnalysis | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: apiError } = await supabase.functions.invoke('ai-analysis', {
        body: { symbol, analysisType, data }
      });

      if (apiError) throw apiError;
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get AI analysis';
      setError(errorMsg);
      console.error('AI Analysis error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAIAnalysis,
    isLoading,
    error
  };
};
