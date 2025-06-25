
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorState {
  error: Error | null;
  isError: boolean;
  retryCount: number;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { maxRetries = 3, onError, showToast = true } = options;
  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    retryCount: 0
  });

  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'operation'}:`, error);
    
    setErrorState(prev => ({
      error,
      isError: true,
      retryCount: prev.retryCount + 1
    }));

    if (showToast) {
      toast({
        title: "Error",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    }

    onError?.(error);
  }, [onError, showToast, toast]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      retryCount: 0
    });
  }, []);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (errorState.retryCount >= maxRetries) {
      handleError(new Error('Maximum retry attempts reached'), 'retry');
      return;
    }

    try {
      clearError();
      return await operation();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Unknown error'), 'retry');
    }
  }, [errorState.retryCount, maxRetries, handleError, clearError]);

  return {
    ...errorState,
    handleError,
    clearError,
    retry,
    canRetry: errorState.retryCount < maxRetries
  };
};
