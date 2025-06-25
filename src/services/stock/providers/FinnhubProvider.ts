
import { StockProvider, StockQuote } from '@/types/stock';

export class FinnhubProvider implements StockProvider {
  name = 'Finnhub';
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const [quote, profile] = await Promise.all([
      this.fetchQuote(symbol),
      this.fetchProfile(symbol)
    ]);

    return {
      symbol: symbol.toUpperCase(),
      name: profile.name || `${symbol.toUpperCase()} Corporation`,
      price: quote.c || 0,
      change: quote.d || 0,
      changePercent: quote.dp || 0,
      lastUpdated: new Date().toISOString()
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes = await Promise.all(
      symbols.map(symbol => this.getQuote(symbol))
    );
    return quotes;
  }

  private async fetchQuote(symbol: string) {
    const response = await fetch(
      `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`
    );
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }
    return response.json();
  }

  private async fetchProfile(symbol: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/stock/profile2?symbol=${symbol}&token=${this.apiKey}`
      );
      if (!response.ok) {
        return { name: `${symbol.toUpperCase()} Corporation` };
      }
      return response.json();
    } catch (error) {
      return { name: `${symbol.toUpperCase()} Corporation` };
    }
  }
}
