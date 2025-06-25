
import { StockProvider, StockQuote } from '@/types/stock';

export class MockProvider implements StockProvider {
  name = 'Mock Data';

  isConfigured(): boolean {
    return true;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const basePrice = 50 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Corporation`,
      price: Number(basePrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      lastUpdated: new Date().toISOString()
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes = await Promise.all(
      symbols.map(symbol => this.getQuote(symbol))
    );
    return quotes;
  }
}
