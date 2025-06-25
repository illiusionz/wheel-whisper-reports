import { StockProvider, StockQuote, OptionsContract, HistoricalDataPoint, WheelStrategyData } from '@/types/stock';

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
  private cache = new Map<string, { data: any; timestamp: number }>();
  private rateLimitTracker: number[] = [];
  private readonly MAX_CALLS_PER_MINUTE = 5;
  private readonly CACHE_TTL = 15000; // 15 seconds

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private canMakeCall(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old calls from tracker
    this.rateLimitTracker = this.rateLimitTracker.filter(time => time > oneMinuteAgo);
    
    return this.rateLimitTracker.length < this.MAX_CALLS_PER_MINUTE;
  }

  private logCall(): void {
    this.rateLimitTracker.push(Date.now());
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private async makeRateLimitedCall<T>(
    url: string, 
    cacheKey: string,
    parser: (data: any) => T
  ): Promise<T> {
    // Check cache first
    const cached = this.getCachedData<T>(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // Check rate limits
    if (!this.canMakeCall()) {
      throw new Error('Polygon API rate limit exceeded. Please wait before making more requests.');
    }

    // Make API call
    this.logCall();
    console.log(`Making API call to: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.statusText}`);
    }
    
    const rawData = await response.json();
    const parsedData = parser(rawData);
    
    // Cache the result
    this.setCachedData(cacheKey, parsedData);
    
    return parsedData;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      console.log(`Fetching optimized quote for ${symbol}...`);
      
      const cacheKey = `quote-${symbol}`;
      
      return await this.makeRateLimitedCall(
        `${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apikey=${this.apiKey}`,
        cacheKey,
        (data) => {
          const ticker = data.ticker;
          if (!ticker) {
            throw new Error(`No data available for ${symbol}`);
          }

          const currentPrice = ticker.last?.price || ticker.min?.c || ticker.day?.c || 0;
          const previousClose = ticker.prevDay?.c || 0;
          const change = previousClose ? currentPrice - previousClose : 0;
          const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

          return {
            symbol: symbol.toUpperCase(),
            name: `${symbol.toUpperCase()}`, // Will be enriched separately if needed
            price: Number(currentPrice.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            volume: ticker.day?.v || ticker.min?.v || 0,
            lastUpdated: new Date().toISOString()
          };
        }
      );
    } catch (error) {
      console.error(`Polygon API error for ${symbol}:`, error);
      throw new Error(`Failed to fetch quote for ${symbol}: ${error}`);
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      // Use Promise.allSettled to prevent one failure from breaking all
      const results = await Promise.allSettled(
        symbols.map(symbol => this.getQuote(symbol))
      );

      return results
        .filter((result): result is PromiseSettledResult<StockQuote> & { status: 'fulfilled' } => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
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
    symbol: string,
    expiration?: string,
    strikePrice?: number,
    contractType?: 'call' | 'put'
  ): Promise<OptionsContract[]> {
    const params = new URLSearchParams({
      'underlying_ticker': symbol,
      'apikey': this.apiKey
    });

    if (expiration) params.append('expiration_date', expiration);
    if (strikePrice) params.append('strike_price', strikePrice.toString());
    if (contractType) params.append('contract_type', contractType);

    const cacheKey = `options-${symbol}-${expiration || 'all'}-${strikePrice || 'all'}-${contractType || 'all'}`;

    return await this.makeRateLimitedCall(
      `${this.baseUrl}/v3/reference/options/contracts?${params}`,
      cacheKey,
      (data) => {
        return (data.results || []).map((contract: any) => ({
          ticker: contract.ticker || '',
          strike_price: contract.strike_price || 0,
          expiration_date: contract.expiration_date || '',
          contract_type: contract.contract_type as 'call' | 'put' || 'call',
          exercise_style: contract.exercise_style,
          shares_per_contract: contract.shares_per_contract,
          underlying_ticker: contract.underlying_ticker || symbol
        }));
      }
    );
  }

  async getHistoricalData(
    symbol: string,
    timespan: 'day' | 'week' | 'month' = 'day',
    from?: string,
    to?: string
  ): Promise<HistoricalDataPoint[]> {
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];
    
    const cacheKey = `historical-${symbol}-${timespan}-${fromDate}-${toDate}`;
    
    return await this.makeRateLimitedCall(
      `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/${timespan}/${fromDate}/${toDate}?apikey=${this.apiKey}`,
      cacheKey,
      (data) => data.results || []
    );
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
    
    if (!optionsChain || optionsChain.length === 0) {
      return null;
    }

    const calls = optionsChain.filter(opt => opt.contract_type === 'call');
    const puts = optionsChain.filter(opt => opt.contract_type === 'put');

    return {
      totalContracts: optionsChain.length,
      calls: calls.length,
      puts: puts.length,
      strikeRange: {
        min: Math.min(...optionsChain.map(opt => opt.strike_price || 0)),
        max: Math.max(...optionsChain.map(opt => opt.strike_price || 0))
      },
      expirationDate: expiration,
      underlyingSymbol: symbol
    };
  }

  async getWheelStrategyData(symbol: string, targetStrike?: number): Promise<WheelStrategyData> {
    // Use cached data where possible to minimize API calls
    const [stockQuote, optionsChain, historicalData] = await Promise.all([
      this.getQuote(symbol),
      this.getOptionsChain(symbol).catch(() => []), // Graceful fallback
      this.getHistoricalData(symbol, 'day', 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ).catch(() => []) // Graceful fallback
    ]);

    const putOptions = optionsChain.filter(opt => 
      opt.contract_type === 'put' && 
      opt.strike_price && 
      opt.strike_price <= stockQuote.price
    );

    const volatility = this.calculateVolatility(historicalData);
    const recommendedStrike = targetStrike || stockQuote.price * 0.95;

    return {
      currentPrice: stockQuote.price,
      volatility,
      suitablePutStrikes: putOptions
        .filter(put => put.strike_price && put.strike_price >= stockQuote.price * 0.85)
        .map(put => ({
          strike: put.strike_price!,
          expiration: put.expiration_date,
          ticker: put.ticker,
          premium: 0, // Would need additional API call - skip to save rate limits
          probability: 0, // Would need calculation
          annualizedReturn: 0 // Would need calculation
        })),
      recommendedStrike,
      riskAnalysis: {
        maxLoss: stockQuote.price - recommendedStrike,
        breakeven: recommendedStrike,
        profitProbability: 0.7 // Simplified calculation
      }
    };
  }

  private calculateVolatility(historicalData: HistoricalDataPoint[]): number {
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

  // Add method to get rate limit status
  getRateLimitStatus() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCalls = this.rateLimitTracker.filter(time => time > oneMinuteAgo);
    
    return {
      remaining: Math.max(0, this.MAX_CALLS_PER_MINUTE - recentCalls.length),
      resetIn: recentCalls.length > 0 ? Math.ceil((recentCalls[0] + 60000 - now) / 1000) : 0,
      cacheSize: this.cache.size
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}
