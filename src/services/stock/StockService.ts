import { StockProvider, StockQuote, StockServiceConfig } from '@/types/stock';
import { FinnhubProvider } from './providers/FinnhubProvider';
import { AlphaVantageProvider } from './providers/AlphaVantageProvider';
import { PolygonProvider } from './providers/PolygonProvider';
import { MockProvider } from './providers/MockProvider';

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
    try {
      if (!this.provider.isConfigured()) {
        throw new Error(`${this.provider.name} provider is not configured`);
      }
      
      console.log(`Fetching quote for ${symbol} using ${this.provider.name}`);
      return await this.provider.getQuote(symbol);
    } catch (error) {
      console.error(`Primary provider (${this.provider.name}) failed:`, error);
      
      if (this.fallbackProvider?.isConfigured()) {
        console.log(`Trying fallback provider: ${this.fallbackProvider.name}`);
        return await this.fallbackProvider.getQuote(symbol);
      }
      
      throw error;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      if (!this.provider.isConfigured()) {
        throw new Error(`${this.provider.name} provider is not configured`);
      }
      
      console.log(`Fetching quotes for ${symbols.length} symbols using ${this.provider.name}`);
      return await this.provider.getMultipleQuotes(symbols);
    } catch (error) {
      console.error(`Primary provider (${this.provider.name}) failed:`, error);
      
      if (this.fallbackProvider?.isConfigured()) {
        console.log(`Trying fallback provider: ${this.fallbackProvider.name}`);
        return await this.fallbackProvider.getMultipleQuotes(symbols);
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
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getOptionsChain(symbol, expiration, strikePrice, contractType);
    }
    throw new Error('Options chain data requires Polygon provider');
  }

  async getHistoricalData(symbol: string, timespan: 'day' | 'week' | 'month' = 'day', from: string, to: string) {
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getHistoricalData(symbol, 1, timespan, from, to);
    }
    throw new Error('Historical data requires Polygon provider');
  }

  async getWheelStrategyData(symbol: string, targetStrike?: number) {
    if (this.provider instanceof PolygonProvider) {
      return await this.provider.getWheelStrategyData(symbol, targetStrike);
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
