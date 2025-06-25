import { CircuitBreaker } from '@/utils/CircuitBreaker';

interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
    data?: any;
  };
}

interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  cacheTTL: number; // Time to live for cached responses in ms
}

export class RateLimiter {
  private requestQueue: Array<{ timestamp: number; resolve: () => void }> = [];
  private cache: RequestCache = {};
  private config: RateLimitConfig;
  private circuitBreaker: CircuitBreaker;

  constructor(config: RateLimitConfig, serviceName: string = 'stock-service') {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      name: serviceName
    });

    // Log circuit breaker state changes
    this.circuitBreaker.onStateChange((state, error) => {
      console.log(`${serviceName} circuit breaker state changed to: ${state}`, error?.message);
    });

    this.cleanup();
  }

  private cleanup() {
    // Clean up old cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.cache).forEach(key => {
        if (now - this.cache[key].timestamp > this.config.cacheTTL) {
          delete this.cache[key];
        }
      });
    }, 300000);
  }

  async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> {
    // Check circuit breaker first
    if (!this.circuitBreaker.isAvailable()) {
      const error = new Error(`Service temporarily unavailable due to circuit breaker`);
      console.warn(`Request blocked by circuit breaker: ${key}`);
      throw error;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && this.cache[key]) {
      const cachedEntry = this.cache[key];
      const now = Date.now();
      
      // Return cached data if still valid
      if (now - cachedEntry.timestamp < this.config.cacheTTL && cachedEntry.data) {
        console.log(`Returning cached data for ${key}`);
        return cachedEntry.data;
      }
      
      // Return existing promise if request is in flight
      if (cachedEntry.promise && now - cachedEntry.timestamp < 30000) {
        console.log(`Request already in flight for ${key}, waiting for result`);
        return cachedEntry.promise;
      }
    }

    // Rate limiting
    await this.waitForRateLimit();

    // Execute request through circuit breaker
    const promise = this.circuitBreaker.execute(async () => {
      return await this.executeWithRetry(requestFn);
    });

    // Cache the promise
    this.cache[key] = {
      promise,
      timestamp: Date.now()
    };

    try {
      const result = await promise;
      
      // Cache the successful result
      this.cache[key] = {
        promise,
        timestamp: Date.now(),
        data: result
      };
      
      return result;
    } catch (error) {
      // Remove failed request from cache
      delete this.cache[key];
      throw error;
    }
  }

  private async executeWithRetry<T>(requestFn: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff: 1s, 2s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old requests from queue
    this.requestQueue = this.requestQueue.filter(req => req.timestamp > oneMinuteAgo);
    
    // Check if we're at the burst limit
    if (this.requestQueue.length >= this.config.burstLimit) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = 60000 - (now - oldestRequest.timestamp) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Add current request to queue
    return new Promise(resolve => {
      this.requestQueue.push({
        timestamp: Date.now(),
        resolve
      });
      resolve();
    });
  }

  getCacheStats() {
    return {
      cacheSize: Object.keys(this.cache).length,
      queueSize: this.requestQueue.length,
      circuitBreakerStats: this.circuitBreaker.getStats(),
      isServiceAvailable: this.circuitBreaker.isAvailable()
    };
  }

  // New method to get circuit breaker status
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.getState(),
      isAvailable: this.circuitBreaker.isAvailable(),
      stats: this.circuitBreaker.getStats()
    };
  }

  // Method to manually reset circuit breaker
  resetCircuitBreaker() {
    this.circuitBreaker.forceReset();
  }
}
