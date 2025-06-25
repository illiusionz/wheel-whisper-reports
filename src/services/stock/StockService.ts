import { StockProvider, StockQuote, StockServiceConfig } from '@/types/stock';
import { FinnhubProvider } from './providers/FinnhubProvider';
import { AlphaVantageProvider } from './providers/AlphaVantageProvider';
import { PolygonProvider } from './providers/PolygonProvider';
import { MockProvider } from './providers/MockProvider';
import { validateStockSymbol, validateStockQuote, sanitizeSymbol } from '@/utils/validation';

export class StockService {
  private provider: StockProvider;
  private fallbackProvider?: StockProvider;
  private config: StockServiceConfig;

  constructor(config: StockServiceConfig) {
    this.config = config;
    this.provider = this.createProvider(config.provider, config.apiKey);
    
    if (config.fallbackProvider) {
      this.fallbackProvider = this.createProvider(config.fallbackProvider, config.apiKey);
    }
  }

  private createProvider(type: StockServiceConfig['provider'], apiKey?: string): StockProvider {
    switch (type) {
      case 'finnhub':
        return new FinnhubProvider(apiKey || '');
      case 'alpha-vantage':
        return new AlphaVantageProvider(apiKey || '');
      case 'polygon':
        return new PolygonProvider(apiKey || '');
      case 'mock':
      default:
        return new MockProvider();
    }
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    // Validate and sanitize input
    const sanitizedSymbol = sanitizeSymbol(symbol);
    const validatedSymbol = validateStockSymbol(sanitizedSymbol);
    
    try {
      if (!this.provider.isConfigured()) {
        throw new Error(`${this.provider.name} provider is not configured`);
      }
      
      console.log(`Fetching quote for ${validatedSymbol} using ${this.provider.name}`);
      const quote = await this.provider.getQuote(validatedSymbol);
      
      // Validate the response
      return validateStockQuote(quote);
    } catch (error) {
      console.error(`Primary provider (${this.provider.name}) failed:`, error);
      
      if (this.fallbackProvider?.isConfigured()) {
        console.log(`Trying fallback provider: ${this.fallbackProvider.name}`);
        const fallbackQuote = await this.fallbackProvider.getQuote(validatedSymbol);
        return validateStockQuote(fallbackQuote);
      }
      
      throw error;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    // Validate and sanitize all symbols
    const validatedSymbols = symbols.map(symbol => {
      const sanitized = sanitizeSymbol(symbol);
      return validateStockSymbol(sanitized);
    });
    
    try {
      if (!this.provider.isConfigured()) {
        throw new Error(`${this.provider.name} provider is not configured`);
      }
      
      console.log(`Fetching quotes for ${validatedSymbols.length} symbols using ${this.provider.name}`);
      const quotes = await this.provider.getMultipleQuotes(validatedSymbols);
      
      // Validate all responses
      return quotes.map(quote => validateStockQuote(quote));
    } catch (error) {
      console.error(`Primary provider (${this.provider.name}) failed:`, error);
      
      if (this.fallbackProvider?.isConfigured()) {
        console.log(`Trying fallback provider: ${this.fallbackProvider.name}`);
        const fallbackQuotes = await this.fallbackProvider.getMultipleQuotes(validatedSymbols);
        return fallbackQuotes.map(quote => validateStockQuote(quote));
      }
      
      throw error;
    }
  }

  getCurrentProvider(): string {
    return this.provider.name;
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  // Method to switch providers on the fly
  switchProvider(type: StockServiceConfig['provider'], apiKey?: string) {
    this.provider = this.createProvider(type, apiKey);
    console.log(`Switched to ${this.provider.name} provider`);
  }

  // Advanced Polygon-specific methods
  async getOptionsChain(symbol: string, expiration?: string, strikePrice?: number, contractType?: 'call' | 'put') {
    const validatedSymbol = validateStockSymbol(sanitizeSymbol(symbol));
    
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getOptionsChain(validatedSymbol, expiration, strikePrice, contractType);
    }
    throw new Error('Options chain data requires Polygon provider');
  }

  async getHistoricalData(symbol: string, timespan: 'day' | 'week' | 'month' = 'day', from?: string, to?: string) {
    const validatedSymbol = validateStockSymbol(sanitizeSymbol(symbol));
    
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getHistoricalData(validatedSymbol, timespan, from, to);
    }
    throw new Error('Historical data requires Polygon provider');
  }

  async getWheelStrategyData(symbol: string, targetStrike?: number) {
    const validatedSymbol = validateStockSymbol(sanitizeSymbol(symbol));
    
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getWheelStrategyData(validatedSymbol, targetStrike);
    }
    throw new Error('Wheel strategy data requires Polygon provider');
  }

  async getMarketStatus() {
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getMarketStatus();
    }
    throw new Error('Market status requires Polygon provider');
  }

  async getDividends(symbol: string) {
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getDividends(symbol);
    }
    throw new Error('Dividend data requires Polygon provider');
  }

  createRealTimeConnection(symbols: string[], onMessage: (data: any) => void): WebSocket | null {
    if (this.provider instanceof PolygonProvider) {
      return this.provider.createWebSocketConnection(symbols, onMessage);
    }
    console.warn('Real-time WebSocket connections require Polygon provider');
    return null;
  }

  // Check if advanced features are available
  hasAdvancedFeatures(): boolean {
    return this.provider instanceof PolygonProvider;
  }

  // Get provider capabilities
  getProviderCapabilities() {
    const capabilities = {
      basicQuotes: true,
      historicalData: false,
      optionsData: false,
      realTimeData: false,
      wheelStrategy: false,
      marketStatus: false,
      dividends: false,
      websockets: false
    };

    if (this.provider instanceof PolygonProvider) {
      return {
        ...capabilities,
        historicalData: true,
        optionsData: true,
        realTimeData: true,
        wheelStrategy: true,
        marketStatus: true,
        dividends: true,
        websockets: true
      };
    }

    if (this.provider instanceof FinnhubProvider) {
      return {
        ...capabilities,
        historicalData: true,
        realTimeData: true,
        websockets: true
      };
    }

    return capabilities;
  }
}
