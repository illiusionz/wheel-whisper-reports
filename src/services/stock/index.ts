
import { StockService } from './StockService';
import { StockServiceConfig } from '@/types/stock';

// Default configuration - easily customizable
const defaultConfig: StockServiceConfig = {
  provider: 'mock', // Start with mock data
  fallbackProvider: 'mock'
};

// Singleton instance
let stockServiceInstance: StockService | null = null;

export function createStockService(config?: Partial<StockServiceConfig>): StockService {
  const finalConfig = { ...defaultConfig, ...config };
  return new StockService(finalConfig);
}

export function getStockService(): StockService {
  if (!stockServiceInstance) {
    stockServiceInstance = createStockService();
  }
  return stockServiceInstance;
}

export function setStockServiceConfig(config: Partial<StockServiceConfig>) {
  stockServiceInstance = createStockService(config);
  return stockServiceInstance;
}

// Export everything for easy access
export * from './StockService';
export * from '@/types/stock';
