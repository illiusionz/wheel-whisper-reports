
import { z } from 'zod';

// Stock symbol validation
export const stockSymbolSchema = z.string()
  .min(1, "Symbol is required")
  .max(10, "Symbol must be 10 characters or less")
  .regex(/^[A-Z]+$/, "Symbol must contain only uppercase letters")
  .transform(s => s.toUpperCase().trim());

// Price validation
export const priceSchema = z.number()
  .positive("Price must be positive")
  .finite("Price must be a valid number")
  .max(1000000, "Price cannot exceed $1,000,000");

// Percentage validation
export const percentageSchema = z.number()
  .finite("Percentage must be a valid number")
  .min(-100, "Percentage cannot be less than -100%")
  .max(1000, "Percentage cannot exceed 1000%");

// Volume validation
export const volumeSchema = z.number()
  .int("Volume must be an integer")
  .nonnegative("Volume cannot be negative")
  .max(1000000000, "Volume cannot exceed 1 billion");

// Market cap validation
export const marketCapSchema = z.number()
  .positive("Market cap must be positive")
  .finite("Market cap must be a valid number")
  .max(100000000000000, "Market cap cannot exceed $100 trillion");

// Date validation
export const dateSchema = z.string()
  .datetime("Invalid date format")
  .or(z.date().transform(d => d.toISOString()));

// Stock quote validation schema
export const stockQuoteSchema = z.object({
  symbol: stockSymbolSchema,
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  price: priceSchema,
  change: z.number().finite("Change must be a valid number"),
  changePercent: percentageSchema,
  volume: volumeSchema.optional(),
  marketCap: marketCapSchema.optional(),
  lastUpdated: dateSchema,
  dayHigh: priceSchema.optional(),
  dayLow: priceSchema.optional(),
  yearHigh: priceSchema.optional(),
  yearLow: priceSchema.optional(),
  averageVolume: volumeSchema.optional(),
  beta: z.number().finite().optional(),
  peRatio: z.number().positive().finite().optional(),
  dividendYield: percentageSchema.optional(),
});

// Options contract validation
export const optionsContractSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  strike_price: priceSchema,
  expiration_date: dateSchema,
  contract_type: z.enum(['call', 'put'], { 
    errorMap: () => ({ message: "Contract type must be 'call' or 'put'" })
  }),
  exercise_style: z.string().optional(),
  shares_per_contract: z.number().int().positive().optional(),
  underlying_ticker: stockSymbolSchema,
  bid: priceSchema.optional(),
  ask: priceSchema.optional(),
  last_price: priceSchema.optional(),
  volume: volumeSchema.optional(),
  open_interest: volumeSchema.optional(),
  implied_volatility: z.number().nonnegative().finite().optional(),
  delta: z.number().min(-1).max(1).finite().optional(),
  gamma: z.number().nonnegative().finite().optional(),
  theta: z.number().finite().optional(),
  vega: z.number().nonnegative().finite().optional(),
});

// Watchlist validation
export const watchlistItemSchema = z.object({
  symbol: stockSymbolSchema,
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  price: priceSchema.nullable(),
  change_amount: z.number().finite("Change amount must be a valid number").nullable(),
  change_percent: percentageSchema.nullable(),
});

// AI analysis validation
export const aiAnalysisRequestSchema = z.object({
  analysisType: z.enum(['technical', 'options', 'risk', 'sentiment', 'news', 'general'], {
    errorMap: () => ({ message: "Invalid analysis type" })
  }),
  symbol: stockSymbolSchema,
  data: z.record(z.any()).optional(),
  requiresRealTime: z.boolean().default(false),
  forceModel: z.enum(['claude', 'openai', 'perplexity']).optional(),
  maxTokens: z.number().int().positive().max(4000).default(1000),
  temperature: z.number().min(0).max(2).default(0.3),
});

// Trading chat validation
export const tradingChatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  symbol: stockSymbolSchema.optional(),
  context: z.string().max(1000, "Context too long").optional(),
});

// Validation helper functions
export function validateStockSymbol(symbol: string): string {
  try {
    return stockSymbolSchema.parse(symbol);
  } catch (error) {
    throw new Error(`Invalid stock symbol: ${symbol}`);
  }
}

export function validateStockQuote(quote: any) {
  try {
    return stockQuoteSchema.parse(quote);
  } catch (error) {
    console.error('Stock quote validation failed:', error);
    throw new Error('Invalid stock quote data');
  }
}

export function validateOptionsContract(contract: any) {
  try {
    return optionsContractSchema.parse(contract);
  } catch (error) {
    console.error('Options contract validation failed:', error);
    throw new Error('Invalid options contract data');
  }
}

export function validateAIAnalysisRequest(request: any) {
  try {
    return aiAnalysisRequestSchema.parse(request);
  } catch (error) {
    console.error('AI analysis request validation failed:', error);
    throw new Error('Invalid AI analysis request');
  }
}

export function validateTradingChatMessage(message: any) {
  try {
    return tradingChatSchema.parse(message);
  } catch (error) {
    console.error('Trading chat validation failed:', error);
    throw new Error('Invalid trading chat message');
  }
}

// Input sanitization utilities
export function sanitizeSymbol(symbol: string): string {
  return symbol.toUpperCase().trim().replace(/[^A-Z]/g, '');
}

export function sanitizeNumericInput(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? null : num;
}

export function sanitizeStringInput(value: any, maxLength: number = 200): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

// Type guards
export function isValidStockSymbol(symbol: any): symbol is string {
  return typeof symbol === 'string' && /^[A-Z]{1,10}$/.test(symbol);
}

export function isValidPrice(price: any): price is number {
  return typeof price === 'number' && price > 0 && isFinite(price);
}

export function isValidPercentage(percentage: any): percentage is number {
  return typeof percentage === 'number' && isFinite(percentage) && percentage >= -100 && percentage <= 1000;
}
