
import { StockServiceManager } from './StockServiceManager';
import { StockServiceConfig } from '@/types/stock';

// Load saved configuration from localStorage
const getSavedConfig = (): Partial<StockServiceConfig> => {
  try {
    const savedConfig = localStorage.getItem('stock-provider-config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      return {
        provider: config.provider,
        apiKey: config.apiKey || undefined,
        fallbackProvider: 'mock'
      };
    }
  } catch (error) {
    console.error('Error loading saved stock provider config:', error);
  }
  return {};
};

// Default configuration with saved settings
const defaultConfig: StockServiceConfig = {
  provider: 'mock',
  fallbackProvider: 'mock',
  ...getSavedConfig()
};

// Singleton instance
let stockServiceInstance: StockServiceManager | null = null;

export function createStockService(config?: Partial<StockServiceConfig>): StockServiceManager {
  const finalConfig = { ...defaultConfig, ...config };
  return new StockServiceManager(finalConfig);
}

export function getStockService(): StockServiceManager {
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
export * from './StockServiceManager';
export * from '@/types/stock';
