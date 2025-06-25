
import { useState, useCallback, useEffect } from 'react';
import { CircuitBreaker, CircuitBreakerManager } from '@/utils/CircuitBreaker';
import { useToast } from '@/hooks/use-toast';

interface UseCircuitBreakerOptions {
  serviceName: string;
  failureThreshold?: number;
  resetTimeout?: number;
  showToastOnTrip?: boolean;
}

export const useCircuitBreaker = (options: UseCircuitBreakerOptions) => {
  const { serviceName, failureThreshold = 3, resetTimeout = 30000, showToastOnTrip = true } = options;
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(true);
  const [state, setState] = useState<string>('CLOSED');
  const [stats, setStats] = useState<any>(null);

  const manager = CircuitBreakerManager.getInstance();
  const circuitBreaker = manager.getOrCreate(serviceName, {
    failureThreshold,
    resetTimeout,
    name: serviceName
  });

  useEffect(() => {
    // Set up state change listener
    const handleStateChange = (newState: string, error?: Error) => {
      setState(newState);
      setIsAvailable(newState !== 'OPEN');
      
      if (newState === 'OPEN' && showToastOnTrip) {
        toast({
          title: "Service Temporarily Unavailable",
          description: `${serviceName} is experiencing issues. Please try again in a moment.`,
          variant: "destructive",
        });
      } else if (newState === 'CLOSED') {
        toast({
          title: "Service Restored",
          description: `${serviceName} is back online and working normally.`,
          variant: "default",
        });
      }
    };

    circuitBreaker.onStateChange(handleStateChange);

    // Update initial state
    setState(circuitBreaker.getState());
    setIsAvailable(circuitBreaker.isAvailable());
    setStats(circuitBreaker.getStats());

    // Set up periodic stats update
    const interval = setInterval(() => {
      setStats(circuitBreaker.getStats());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [circuitBreaker, serviceName, showToastOnTrip, toast]);

  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await circuitBreaker.execute(operation);
    } catch (error) {
      // Update stats after execution
      setStats(circuitBreaker.getStats());
      throw error;
    }
  }, [circuitBreaker]);

  const reset = useCallback(() => {
    circuitBreaker.forceReset();
    setStats(circuitBreaker.getStats());
  }, [circuitBreaker]);

  const forceTrip = useCallback(() => {
    circuitBreaker.forceOpen();
    setStats(circuitBreaker.getStats());
  }, [circuitBreaker]);

  return {
    execute,
    reset,
    forceTrip,
    isAvailable,
    state,
    stats,
    serviceName
  };
};
