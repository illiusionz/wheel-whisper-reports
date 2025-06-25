
export type MarketStatus = 'open' | 'closed' | 'pre-market' | 'after-hours';

export interface MarketHours {
  isOpen: boolean;
  nextOpen: Date | null;
  nextClose: Date | null;
  currentStatus: MarketStatus;
  timezone: string;
}

export interface MarketSchedule {
  regularOpen: string;
  regularClose: string;
  preMarketOpen: string;
  afterHoursClose: string;
}

export interface TradingSession {
  name: string;
  start: string;
  end: string;
  isActive: boolean;
}
