
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHybridAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHybridAnalysis = async (
    analysisType: string,
    symbol: string,
    data: any,
    requiresRealTime: boolean = false,
    forceModel?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Starting hybrid AI analysis for ${symbol} - Type: ${analysisType}`);
      
      const { data: result, error: functionError } = await supabase.functions.invoke('hybrid-ai-analysis', {
        body: {
          analysisType,
          symbol,
          data,
          requiresRealTime,
          forceModel,
          maxTokens: 2000, // Increased token limit
          temperature: 0.3
        }
      });

      if (functionError) {
        console.error('Hybrid AI function error:', functionError);
        throw functionError;
      }

      if (!result) {
        console.error('No result returned from hybrid AI analysis');
        throw new Error('No analysis result received');
      }

      console.log(`Hybrid AI analysis completed for ${symbol}:`, {
        model: result.model,
        contentLength: result.content?.length || 0,
        confidence: result.confidence,
        timestamp: result.timestamp
      });

      // Check if content seems truncated
      if (result.content && result.content.length > 0) {
        const lastChar = result.content.trim().slice(-1);
        const seemsTruncated = !['.", "!", "?", '.', ':', ';'].includes(lastChar) && 
                              !result.content.trim().endsWith('...') &&
                              result.content.length > 500;
        
        if (seemsTruncated) {
          console.warn(`AI response for ${symbol} may be truncated. Last character: "${lastChar}"`);
        }
      }

      return {
        content: result.content || 'Analysis completed but no content received.',
        model: result.model || 'unknown',
        confidence: result.confidence || 0.7,
        timestamp: result.timestamp || new Date().toISOString(),
        analysisType,
        symbol,
        metadata: result.metadata || {}
      };

    } catch (err: any) {
      console.error('Hybrid AI analysis error:', err);
      setError(err.message || 'Failed to get AI analysis');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getHybridAnalysis,
    isLoading,
    error
  };
};
