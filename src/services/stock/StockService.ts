
import { StockProvider, StockQuote, StockServiceConfig } from '@/types/stock';
import { FinnhubProvider } from './providers/FinnhubProvider';
import { AlphaVantageProvider } from './providers/AlphaVantageProvider';
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
        // TODO: Implement PolygonProvider
        throw new Error('Polygon provider not yet implemented');
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
}
