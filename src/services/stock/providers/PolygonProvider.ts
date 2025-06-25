import { StockProvider, StockQuote } from '@/types/stock';

interface PolygonQuote {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  v: number; // volume
  vw: number; // volume weighted average price
  t: number; // timestamp
}

interface PolygonTickerDetails {
  name: string;
  market_cap?: number;
  description?: string;
  primary_exchange?: string;
  type?: string;
  currency_name?: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  ticker: string;
}

interface PolygonPreviousClose {
  c: number;
  h: number;
  l: number;
  o: number;
  v: number;
  vw: number;
  t: number;
  T: string;
}

interface PolygonRealTimeQuote {
  symbol: string;
  last: {
    price: number;
    size: number;
    exchange: number;
    timeframe: string;
  };
  min: {
    c: number;
    h: number;
    l: number;
    o: number;
    t: number;
    v: number;
    vw: number;
  };
  prevDay: {
    c: number;
    h: number;
    l: number;
    o: number;
    v: number;
    vw: number;
  };
}

interface PolygonOptionsContract {
  cfi?: string;
  contract_type?: string;
  exercise_style?: string;
  expiration_date?: string;
  primary_exchange?: string;
  shares_per_contract?: number;
  strike_price?: number;
  ticker?: string;
  underlying_ticker?: string;
}

interface PolygonOptionsChain {
  results?: PolygonOptionsContract[];
  status: string;
  request_id: string;
  count: number;
  next_url?: string;
}

interface PolygonMarketStatus {
  market: string;
  serverTime: string;
  exchanges: {
    nasdaq: string;
    nyse: string;
    otc: string;
  };
  currencies: {
    fx: string;
    crypto: string;
  };
}

export class PolygonProvider implements StockProvider {
  name = 'Polygon.io';
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io';
  private wsUrl = 'wss://socket.polygon.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      console.log(`Fetching detailed quote for ${symbol}...`);
      
      // Try to get real-time quote first, then fall back to previous close
      const [realTimeQuote, previousClose, tickerDetails] = await Promise.allSettled([
        this.getRealTimeQuote(symbol),
        this.getPreviousClose(symbol),
        this.getTickerDetails(symbol)
      ]);

      let currentPrice = 0;
      let previousClosePrice = 0;
      let volume = 0;
      let companyName = `${symbol.toUpperCase()}`;

      // Handle real-time quote
      if (realTimeQuote.status === 'fulfilled' && realTimeQuote.value) {
        currentPrice = realTimeQuote.value.last?.price || realTimeQuote.value.min?.c || 0;
        previousClosePrice = realTimeQuote.value.prevDay?.c || 0;
        volume = realTimeQuote.value.min?.v || 0;
        console.log(`Real-time data for ${symbol}:`, realTimeQuote.value);
      }

      // Fallback to previous close if real-time fails
      if (!currentPrice && previousClose.status === 'fulfilled' && previousClose.value) {
        currentPrice = previousClose.value.c;
        previousClosePrice = previousClose.value.o; // Use open as previous reference
        volume = previousClose.value.v;
        console.log(`Using previous close data for ${symbol}:`, previousClose.value);
      }

      // Handle company name
      if (tickerDetails.status === 'fulfilled' && tickerDetails.value?.name) {
        companyName = tickerDetails.value.name;
      }

      if (!currentPrice) {
        throw new Error(`No market data available for ${symbol}`);
      }

      // Calculate change
      const change = previousClosePrice ? currentPrice - previousClosePrice : 0;
      const changePercent = previousClosePrice !== 0 ? (change / previousClosePrice) * 100 : 0;

      const quote: StockQuote = {
        symbol: symbol.toUpperCase(),
        name: companyName,
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: volume,
        marketCap: tickerDetails.status === 'fulfilled' ? tickerDetails.value?.market_cap : undefined,
        lastUpdated: new Date().toISOString()
      };

      console.log(`Final processed quote for ${symbol}:`, quote);
      return quote;
    } catch (error) {
      console.error(`Polygon API error for ${symbol}:`, error);
      throw new Error(`Failed to fetch quote for ${symbol}: ${error}`);
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      const quotes = await Promise.all(
        symbols.map(symbol => this.getQuote(symbol).catch(error => {
          console.error(`Failed to fetch ${symbol}:`, error);
          return null;
        }))
      );
      return quotes.filter(quote => quote !== null) as StockQuote[];
    } catch (error) {
      console.error('Polygon batch quote error:', error);
      throw error;
    }
  }

  // Try to get real-time quote (may require higher tier subscription)
  private async getRealTimeQuote(symbol: string): Promise<PolygonRealTimeQuote | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${this.apiKey}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.ticker || null;
    } catch (error) {
      console.error('Error fetching real-time quote:', error);
      return null;
    }
  }

  private async getPreviousClose(symbol: string): Promise<PolygonPreviousClose | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/aggs/ticker/${symbol}/prev?apikey=${this.apiKey}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      console.log(`Raw Polygon response for ${symbol}:`, data);
      return data.results?.[0] || null;
    } catch (error) {
      console.error('Error fetching previous close:', error);
      return null;
    }
  }

  private async getTickerDetails(symbol: string): Promise<PolygonTickerDetails | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/reference/tickers/${symbol}?apikey=${this.apiKey}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.results || null;
    } catch (error) {
      console.error('Error fetching ticker details:', error);
      return null;
    }
  }

  async getOptionsChain(
    underlyingSymbol: string,
    expiration?: string,
    strikePrice?: number,
    contractType?: 'call' | 'put'
  ): Promise<PolygonOptionsChain> {
    const params = new URLSearchParams({
      'underlying_ticker': underlyingSymbol,
      'apikey': this.apiKey
    });

    if (expiration) params.append('expiration_date', expiration);
    if (strikePrice) params.append('strike_price', strikePrice.toString());
    if (contractType) params.append('contract_type', contractType);

    const response = await fetch(`${this.baseUrl}/v3/reference/options/contracts?${params}`);
    if (!response.ok) {
      throw new Error(`Polygon Options API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getHistoricalData(
    symbol: string,
    multiplier: number = 1,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day',
    from: string,
    to: string
  ) {
    const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?apikey=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Polygon Historical API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getMarketStatus(): Promise<PolygonMarketStatus> {
    const response = await fetch(`${this.baseUrl}/v1/marketstatus/now?apikey=${this.apiKey}`);
    if (!response.ok) {
      throw new Error(`Polygon Market Status API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getDividends(symbol: string) {
    const response = await fetch(`${this.baseUrl}/v3/reference/dividends?ticker=${symbol}&apikey=${this.apiKey}`);
    if (!response.ok) {
      throw new Error(`Polygon Dividends API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockSplits(symbol: string) {
    const response = await fetch(`${this.baseUrl}/v3/reference/splits?ticker=${symbol}&apikey=${this.apiKey}`);
    if (!response.ok) {
      throw new Error(`Polygon Stock Splits API error: ${response.statusText}`);
    }

    return response.json();
  }

  createWebSocketConnection(symbols: string[], onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`${this.wsUrl}/stocks`);
    
    ws.onopen = () => {
      console.log('Polygon WebSocket connected');
      ws.send(JSON.stringify({
        action: 'auth',
        params: this.apiKey
      }));
      
      ws.send(JSON.stringify({
        action: 'subscribe',
        params: symbols.map(symbol => `T.${symbol}`).join(',')
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onerror = (error) => {
      console.error('Polygon WebSocket error:', error);
    };

    return ws;
  }

  async getOptionsAnalysis(symbol: string, expiration: string) {
    const optionsChain = await this.getOptionsChain(symbol, expiration);
    
    if (!optionsChain.results) {
      return null;
    }

    const calls = optionsChain.results.filter(opt => opt.contract_type === 'call');
    const puts = optionsChain.results.filter(opt => opt.contract_type === 'put');

    return {
      totalContracts: optionsChain.results.length,
      calls: calls.length,
      puts: puts.length,
      strikeRange: {
        min: Math.min(...optionsChain.results.map(opt => opt.strike_price || 0)),
        max: Math.max(...optionsChain.results.map(opt => opt.strike_price || 0))
      },
      expirationDate: expiration,
      underlyingSymbol: symbol
    };
  }

  async getWheelStrategyData(symbol: string, targetStrike?: number) {
    const [stockQuote, optionsChain, historicalData] = await Promise.all([
      this.getQuote(symbol),
      this.getOptionsChain(symbol),
      this.getHistoricalData(symbol, 1, 'day', 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      )
    ]);

    const putOptions = optionsChain.results?.filter(opt => 
      opt.contract_type === 'put' && 
      opt.strike_price && 
      opt.strike_price <= stockQuote.price
    ) || [];

    return {
      currentPrice: stockQuote.price,
      volatility: this.calculateVolatility(historicalData.results || []),
      suitablePutStrikes: putOptions
        .filter(put => put.strike_price && put.strike_price >= stockQuote.price * 0.85)
        .map(put => ({
          strike: put.strike_price,
          expiration: put.expiration_date,
          ticker: put.ticker
        })),
      recommendedStrike: targetStrike || stockQuote.price * 0.95
    };
  }

  private calculateVolatility(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      const prevClose = historicalData[i - 1].c;
      const currentClose = historicalData[i].c;
      returns.push(Math.log(currentClose / prevClose));
    }
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252) * 100;
  }
}
