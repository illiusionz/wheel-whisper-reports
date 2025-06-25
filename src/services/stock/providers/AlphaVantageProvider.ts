
import { StockProvider, StockQuote } from '@/types/stock';

export class AlphaVantageProvider implements StockProvider {
  name = 'Alpha Vantage';
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const response = await fetch(
      `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.statusText}`);
    }

    const data = await response.json();
    const quote = data['Global Quote'];

    if (!quote) {
      throw new Error(`No data found for symbol: ${symbol}`);
    }

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Corporation`,
      price,
      change,
      changePercent,
      lastUpdated: new Date().toISOString()
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    // Alpha Vantage doesn't support batch requests in free tier
    // We'll make individual requests with a small delay to respect rate limits
    const quotes: StockQuote[] = [];
    
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        quotes.push(quote);
        // Small delay to respect rate limits (5 requests per minute)
        await new Promise(resolve => setTimeout(resolve, 12000));
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
      }
    }
    
    return quotes;
  }
}
