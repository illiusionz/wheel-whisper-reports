
import { useState } from 'react';
import { getStockService } from '@/services/stock';

interface Report {
  lastUpdated: string;
  stockData?: any;
  wheelData?: any;
  sections: any;
}

export const useReportManager = () => {
  const [reports, setReports] = useState<{[key: string]: Report}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshReport = async (symbol?: string, selectedStock?: string | null) => {
    setIsRefreshing(true);
    
    try {
      const targetSymbol = symbol || selectedStock;
      if (targetSymbol) {
        const stockService = getStockService();
        
        // Reset circuit breaker if it's open
        if (stockService.getCircuitBreakerStatus && stockService.resetCircuitBreaker) {
          const status = stockService.getCircuitBreakerStatus();
          if (status.state === 'OPEN') {
            console.log('Resetting circuit breaker for report refresh');
            stockService.resetCircuitBreaker();
          }
        }
        
        // Get real stock data with retry logic
        let stockData;
        try {
          stockData = await stockService.getQuote(targetSymbol);
        } catch (error) {
          console.error('Failed to get stock quote:', error);
          // If the first attempt fails, try once more
          try {
            console.log('Retrying stock quote after initial failure');
            stockData = await stockService.getQuote(targetSymbol, true); // force refresh
          } catch (retryError) {
            console.error('Stock quote retry also failed:', retryError);
            throw retryError;
          }
        }
        
        // Try to get wheel strategy data if available
        let wheelData = null;
        if (stockService.hasAdvancedFeatures()) {
          try {
            wheelData = await stockService.getWheelStrategyData(targetSymbol);
          } catch (error) {
            console.log('Wheel strategy data not available:', error);
          }
        }

        setReports(prev => ({
          ...prev,
          [targetSymbol]: {
            lastUpdated: new Date().toISOString(),
            stockData,
            wheelData,
            sections: {
              // Report sections with real data integration
              macroCalendar: {},
              stockOverview: { stockData },
              technicalSnapshot: {},
              expectedClosing: {},
              optionsActivity: {},
              wheelLadder: { wheelData },
              executionTiming: {},
              fundamentals: {},
              capitalFlows: {},
              volatilitySentiment: {},
              newsCatalysts: {},
              sectorAnalysis: {},
              confidenceLevel: {}
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error refreshing report:', error);
      // Don't throw the error, just log it to prevent UI crashes
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshAll = async (watchlist: any[]) => {
    setIsRefreshing(true);
    try {
      const stockService = getStockService();
      
      // Reset circuit breaker if needed
      if (stockService.getCircuitBreakerStatus && stockService.resetCircuitBreaker) {
        const status = stockService.getCircuitBreakerStatus();
        if (status.state === 'OPEN') {
          console.log('Resetting circuit breaker for refresh all');
          stockService.resetCircuitBreaker();
        }
      }
      
      const newReports: {[key: string]: Report} = {};
      
      for (const stock of watchlist) {
        try {
          const stockData = await stockService.getQuote(stock.symbol);
          let wheelData = null;
          
          if (stockService.hasAdvancedFeatures()) {
            try {
              wheelData = await stockService.getWheelStrategyData(stock.symbol);
            } catch (error) {
              console.log(`Wheel strategy data not available for ${stock.symbol}:`, error);
            }
          }

          newReports[stock.symbol] = {
            lastUpdated: new Date().toISOString(),
            stockData,
            wheelData,
            sections: {}
          };
        } catch (error) {
          console.error(`Error fetching data for ${stock.symbol}:`, error);
          // Continue with other stocks even if one fails
        }
      }
      
      setReports(newReports);
    } catch (error) {
      console.error('Error refreshing all reports:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const removeReport = (symbol: string) => {
    setReports(prev => {
      const newReports = { ...prev };
      delete newReports[symbol];
      return newReports;
    });
  };

  return {
    reports,
    isRefreshing,
    handleRefreshReport,
    handleRefreshAll,
    removeReport
  };
};
