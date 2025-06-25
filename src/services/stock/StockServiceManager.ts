
import { StockService } from './StockService';
import { StockServiceConfig, StockQuote } from '@/types/stock';
import { RateLimiter } from './RateLimiter';

// Provider-specific rate limit configurations
const PROVIDER_RATE_LIMITS = {
  'alpha-vantage': {
    requestsPerMinute: 5,
    burstLimit: 5,
    cacheTTL: 60000 // 1 minute cache for free tier
  },
  'finnhub': {
    requestsPerMinute: 60,
    burstLimit: 30,
    cacheTTL: 15000 // 15 seconds cache
  },
  'polygon': {
    requestsPerMinute: 5,
    burstLimit: 5,
    cacheTTL: 15000 // 15 seconds cache
  },
  'mock': {
    requestsPerMinute: 1000,
    burstLimit: 100,
    cacheTTL: 5000 // 5 seconds cache for testing
  }
};

export class StockServiceManager {
  private stockService: StockService;
  private rateLimiter: RateLimiter;
  private activeRequests = new Set<string>();

  constructor(config: StockServiceConfig) {
    this.stockService = new StockService(config);
    
    const rateConfig = PROVIDER_RATE_LIMITS[config.provider] || PROVIDER_RATE_LIMITS.mock;
    this.rateLimiter = new RateLimiter(rateConfig, `stock-${config.provider}`);
  }

  async getQuote(symbol: string, forceRefresh = false): Promise<StockQuote> {
    const key = `quote-${symbol}`;
    
    return this.rateLimiter.executeRequest(
      key,
      () => this.stockService.getQuote(symbol),
      forceRefresh
    );
  }

  async getMultipleQuotes(symbols: string[], forceRefresh = false): Promise<StockQuote[]> {
    // Prevent duplicate batch requests
    const key = `batch-${symbols.sort().join(',')}`;
    
    if (this.activeRequests.has(key)) {
      console.log('Batch request already in progress, skipping duplicate');
      throw new Error('Duplicate batch request prevented');
    }

    try {
      this.activeRequests.add(key);
      
      return await this.rateLimiter.executeRequest(
        key,
        () => this.stockService.getMultipleQuotes(symbols),
        forceRefresh
      );
    } finally {
      this.activeRequests.delete(key);
    }
  }

  // Delegate advanced methods to underlying service
  async getOptionsChain(symbol: string, expiration?: string, strikePrice?: number, contractType?: 'call' | 'put') {
    const key = `options-${symbol}-${expiration || 'all'}-${strikePrice || 'all'}-${contractType || 'all'}`;
    
    return this.rateLimiter.executeRequest(
      key,
      () => this.stockService.getOptionsChain(symbol, expiration, strikePrice, contractType)
    );
  }

  async getHistoricalData(symbol: string, timespan: 'day' | 'week' | 'month' = 'day', from: string, to: string) {
    const key = `historical-${symbol}-${timespan}-${from}-${to}`;
    
    return this.rateLimiter.executeRequest(
      key,
      () => this.stockService.getHistoricalData(symbol, timespan, from, to)
    );
  }

  async getWheelStrategyData(symbol: string, targetStrike?: number) {
    const key = `wheel-${symbol}-${targetStrike || 'auto'}`;
    
    return this.rateLimiter.executeRequest(
      key,
      () => this.stockService.getWheelStrategyData(symbol, targetStrike)
    );
  }

  // Utility methods
  getCurrentProvider(): string {
    return this.stockService.getCurrentProvider();
  }

  isConfigured(): boolean {
    return this.stockService.isConfigured();
  }

  hasAdvancedFeatures(): boolean {
    return this.stockService.hasAdvancedFeatures();
  }

  getProviderCapabilities() {
    return this.stockService.getProviderCapabilities();
  }

  switchProvider(type: StockServiceConfig['provider'], apiKey?: string) {
    this.stockService.switchProvider(type, apiKey);
    
    // Update rate limiter for new provider
    const rateConfig = PROVIDER_RATE_LIMITS[type] || PROVIDER_RATE_LIMITS.mock;
    this.rateLimiter = new RateLimiter(rateConfig, `stock-${type}`);
  }

  getRateLimitStats() {
    return this.rateLimiter.getCacheStats();
  }

  // New methods for circuit breaker management
  getCircuitBreakerStatus() {
    return this.rateLimiter.getCircuitBreakerStatus();
  }

  resetCircuitBreaker() {
    this.rateLimiter.resetCircuitBreaker();
  }
}
