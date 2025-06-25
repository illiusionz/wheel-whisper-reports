
import { StockQuote, WheelStrategyData } from './stock';

export interface MCPReportSection {
  id: string;
  title: string;
  data: Record<string, any>;
  lastUpdated: string;
  status: 'loading' | 'success' | 'error';
}

export interface MCPReportData {
  id: string;
  symbol: string;
  lastUpdated: string;
  stockData?: StockQuote;
  wheelData?: WheelStrategyData;
  sections: {
    macroCalendar: MCPReportSection;
    stockOverview: MCPReportSection;
    technicalSnapshot: MCPReportSection;
    expectedClosing: MCPReportSection;
    optionsActivity: MCPReportSection;
    wheelLadder: MCPReportSection;
    executionTiming: MCPReportSection;
    fundamentals: MCPReportSection;
    capitalFlows: MCPReportSection;
    volatilitySentiment: MCPReportSection;
    newsCatalysts: MCPReportSection;
    sectorAnalysis: MCPReportSection;
    confidenceLevel: MCPReportSection;
  };
}

export interface ReportGenerationOptions {
  symbol: string;
  includeAdvanced?: boolean;
  timeframe?: 'daily' | 'weekly' | 'monthly';
  refreshData?: boolean;
}

export interface ReportManagerState {
  reports: Record<string, MCPReportData>;
  isRefreshing: boolean;
  error: string | null;
  lastRefreshTime: Date | null;
}
