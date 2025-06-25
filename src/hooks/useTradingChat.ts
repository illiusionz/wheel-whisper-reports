
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRateLimitedAPI } from '@/hooks/useRateLimitedAPI';
import { useToast } from '@/hooks/use-toast';
import { validateTradingChatMessage, sanitizeSymbol, sanitizeStringInput } from '@/utils/validation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  symbol?: string;
}

export const useTradingChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const rateLimiter = useRateLimitedAPI<any>({
    maxCallsPerMinute: 5,
    cacheTTL: 0,
    debounceMs: 500
  });

  const sendMessage = async (message: string, symbol?: string, context?: string) => {
    if (!rateLimiter.canMakeCall()) {
      toast({
        title: "Rate Limited",
        description: "Please wait before sending another message.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate and sanitize input
      const validatedMessage = validateTradingChatMessage({
        message: sanitizeStringInput(message, 2000),
        symbol: symbol ? sanitizeSymbol(symbol) : undefined,
        context: context ? sanitizeStringInput(context, 1000) : undefined
      });

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: validatedMessage.message,
        timestamp: new Date().toISOString(),
        symbol: validatedMessage.symbol
      };

      setMessages(prev => [...prev, userMessage]);

      const cacheKey = `chat-${Date.now()}`;
      
      const result = await rateLimiter.debouncedCall(
        cacheKey,
        async () => {
          const { data: result, error: apiError } = await supabase.functions.invoke('trading-chat', {
            body: validatedMessage
          });

          if (apiError) throw apiError;
          return result;
        }
      );

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: result.timestamp,
        symbol: validatedMessage.symbol
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);
      console.error('Trading chat error:', err);
      
      if (errorMsg.includes('Rate limit')) {
        toast({
          title: "Rate Limited",
          description: "Too many chat messages. Please wait before sending another.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    error,
    remainingCalls: rateLimiter.getRemainingCalls(),
    canSendMessage: rateLimiter.canMakeCall()
  };
};
