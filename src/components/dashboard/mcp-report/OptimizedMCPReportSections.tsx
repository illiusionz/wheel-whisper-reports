
import React, { memo } from 'react';
import { StockQuote } from '@/types/stock';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import MacroCalendar from '../mcp-sections/MacroCalendar';
import StockOverview from '../mcp-sections/StockOverview';
import TechnicalSnapshot from '../mcp-sections/TechnicalSnapshot';
import ExpectedClosing from '../mcp-sections/ExpectedClosing';
import OptionsActivity from '../mcp-sections/OptionsActivity';
import WheelStrategyLadder from '../mcp-sections/WheelStrategyLadder';
import TradingChatPanel from '@/components/ai/TradingChatPanel';

interface OptimizedMCPReportSectionsProps {
  symbol: string;
  stockData: StockQuote;
}

// Memoized individual section components
const MemoizedMacroCalendar = memo(MacroCalendar);
const MemoizedStockOverview = memo(StockOverview);
const MemoizedTechnicalSnapshot = memo(TechnicalSnapshot);
const MemoizedExpectedClosing = memo(ExpectedClosing);
const MemoizedOptionsActivity = memo(OptionsActivity);
const MemoizedWheelStrategyLadder = memo(WheelStrategyLadder);
const MemoizedTradingChatPanel = memo(TradingChatPanel);

const OptimizedMCPReportSections: React.FC<OptimizedMCPReportSectionsProps> = memo(({ symbol, stockData }) => {
  // Memoize the trading chat context to prevent unnecessary re-renders
  const tradingContext = React.useMemo(() => 
    `Current price: $${stockData.price}, Change: ${stockData.changePercent.toFixed(2)}%`,
    [stockData.price, stockData.changePercent]
  );

  return (
    <>
      <ErrorBoundary level="component">
        <MemoizedMacroCalendar symbol={symbol} />
      </ErrorBoundary>

      <ErrorBoundary level="component">
        <MemoizedStockOverview symbol={symbol} stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <MemoizedTechnicalSnapshot stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <MemoizedExpectedClosing stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <MemoizedOptionsActivity stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <MemoizedWheelStrategyLadder stockData={stockData} />
      </ErrorBoundary>

      <ErrorBoundary level="component">
        <MemoizedTradingChatPanel 
          symbol={symbol} 
          context={tradingContext}
        />
      </ErrorBoundary>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.stockData.price === nextProps.stockData.price &&
    prevProps.stockData.changePercent === nextProps.stockData.changePercent &&
    prevProps.stockData.lastUpdated === nextProps.stockData.lastUpdated
  );
});

OptimizedMCPReportSections.displayName = 'OptimizedMCPReportSections';

export default OptimizedMCPReportSections;
