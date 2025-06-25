
import React from 'react';
import { StockQuote } from '@/types/stock';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import MacroCalendar from '../mcp-sections/MacroCalendar';
import StockOverview from '../mcp-sections/StockOverview';
import TechnicalSnapshot from '../mcp-sections/TechnicalSnapshot';
import ExpectedClosing from '../mcp-sections/ExpectedClosing';
import OptionsActivity from '../mcp-sections/OptionsActivity';
import WheelStrategyLadder from '../mcp-sections/WheelStrategyLadder';
import TradingChatPanel from '@/components/ai/TradingChatPanel';

interface MCPReportSectionsProps {
  symbol: string;
  stockData: StockQuote;
}

const MCPReportSections: React.FC<MCPReportSectionsProps> = ({ symbol, stockData }) => {
  return (
    <>
      <ErrorBoundary level="component">
        <MacroCalendar symbol={symbol} />
      </ErrorBoundary>

      <ErrorBoundary level="component">
        <StockOverview symbol={symbol} stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <TechnicalSnapshot stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <ExpectedClosing stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <OptionsActivity stockData={stockData} />
      </ErrorBoundary>
      
      <ErrorBoundary level="component">
        <WheelStrategyLadder stockData={stockData} />
      </ErrorBoundary>

      <ErrorBoundary level="component">
        <TradingChatPanel 
          symbol={symbol} 
          context={`Current price: $${stockData.price}, Change: ${stockData.changePercent.toFixed(2)}%`}
        />
      </ErrorBoundary>
    </>
  );
};

export default MCPReportSections;
