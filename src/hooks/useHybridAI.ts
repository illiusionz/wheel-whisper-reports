
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
    console.log('=== HYBRID AI HOOK START ===')
    console.log('Analysis Type:', analysisType)
    console.log('Symbol:', symbol)
    console.log('Data:', JSON.stringify(data, null, 2))
    console.log('Requires Real Time:', requiresRealTime)
    console.log('Force Model:', forceModel)
    
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Starting hybrid AI analysis for ${symbol} - Type: ${analysisType}`);
      
      const requestPayload = {
        analysisType,
        symbol,
        data,
        requiresRealTime,
        forceModel,
        maxTokens: 2000,
        temperature: 0.3
      }
      
      console.log('=== SUPABASE FUNCTION CALL ===')
      console.log('Request payload:', JSON.stringify(requestPayload, null, 2))
      
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
        setError(errorMessage);
        return null;
      }

      if (!result) {
        console.error('=== NO RESULT FROM FUNCTION ===')
        console.error('Result is null or undefined')
        setError('No analysis result received');
        return null;
      }

      console.log('=== RESULT VALIDATION ===')
      console.log('Result type:', typeof result)
      console.log('Result keys:', Object.keys(result))
      console.log('Result.content exists:', !!result.content)
      console.log('Result.content length:', result.content?.length || 0)
      console.log('Result.error exists:', !!result.error)
      
      // Check if the result contains an error
      if (result.error) {
        console.error('=== RESULT CONTAINS ERROR ===')
        console.error('Error in result:', result.error)
        console.error('Error details:', result.details)
        console.error('Error type:', result.errorType)
        setError(result.error);
        return null;
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
        const seemsTruncated = !['.', '!', '?', ':', ';'].some(char => 
          result.content.trim().endsWith(char + '"') || result.content.trim().endsWith(char)
        ) && !result.content.trim().endsWith('...') && result.content.length > 500;
        
        if (seemsTruncated) {
          console.warn(`AI response for ${symbol} may be truncated. Last character: "${lastChar}"`);
        }
      }

      setError(null);
      
      const finalResult = {
        content: result.content || 'Analysis completed but no content received.',
        model: result.model || 'unknown',
        confidence: result.confidence || 0.7,
        timestamp: result.timestamp || new Date().toISOString(),
        analysisType,
        symbol,
        metadata: result.metadata || {}
      };
      
      console.log('=== FINAL RESULT ===')
      console.log('Final result:', finalResult)
      console.log('=== HYBRID AI HOOK END ===')
      
      return finalResult;

    } catch (err: any) {
      console.error('=== HOOK CATCH ERROR ===')
      console.error('Error type:', typeof err)
      console.error('Error constructor:', err.constructor.name)
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
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
    error
  };
};
