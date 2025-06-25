
import { StockService } from './StockService';
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
  provider: 'mock', // Will be overridden by saved config if available
  fallbackProvider: 'mock',
  ...getSavedConfig()
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
