
interface MarketHours {
  isOpen: boolean;
  nextOpen: Date | null;
  nextClose: Date | null;
  currentStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  timezone: string;
}

interface MarketSchedule {
  regularOpen: string; // "09:30"
  regularClose: string; // "16:00"
  preMarketOpen: string; // "04:00"
  afterHoursClose: string; // "20:00"
}

export class MarketHoursService {
  private static readonly US_MARKET_SCHEDULE: MarketSchedule = {
    regularOpen: "09:30",
    regularClose: "16:00",
    preMarketOpen: "04:00",
    afterHoursClose: "20:00"
  };

  private static readonly MARKET_HOLIDAYS_2024 = [
    "2024-01-01", // New Year's Day
    "2024-01-15", // MLK Day
    "2024-02-19", // Presidents Day
    "2024-03-29", // Good Friday
    "2024-05-27", // Memorial Day
    "2024-06-19", // Juneteenth
    "2024-07-04", // Independence Day
    "2024-09-02", // Labor Day
    "2024-11-28", // Thanksgiving
    "2024-12-25"  // Christmas
  ];

  static getCurrentMarketHours(): MarketHours {
    const now = new Date();
    const easternTime = this.convertToEasternTime(now);
    const isWeekend = easternTime.getDay() === 0 || easternTime.getDay() === 6;
    const isHoliday = this.isMarketHoliday(easternTime);

    if (isWeekend || isHoliday) {
      return {
        isOpen: false,
        nextOpen: this.getNextMarketOpen(easternTime),
        nextClose: null,
        currentStatus: 'closed',
        timezone: 'ET'
      };
    }

    const currentTime = this.formatTime(easternTime);
    const { regularOpen, regularClose, preMarketOpen, afterHoursClose } = this.US_MARKET_SCHEDULE;

    if (currentTime >= regularOpen && currentTime < regularClose) {
      return {
        isOpen: true,
        nextOpen: null,
        nextClose: this.getNextMarketClose(easternTime),
        currentStatus: 'open',
        timezone: 'ET'
      };
    } else if (currentTime >= preMarketOpen && currentTime < regularOpen) {
      return {
        isOpen: false,
        nextOpen: this.getNextMarketOpen(easternTime),
        nextClose: null,
        currentStatus: 'pre-market',
        timezone: 'ET'
      };
    } else if (currentTime >= regularClose && currentTime < afterHoursClose) {
      return {
        isOpen: false,
        nextOpen: this.getNextMarketOpen(easternTime),
        nextClose: null,
        currentStatus: 'after-hours',
        timezone: 'ET'
      };
    } else {
      return {
        isOpen: false,
        nextOpen: this.getNextMarketOpen(easternTime),
        nextClose: null,
        currentStatus: 'closed',
        timezone: 'ET'
      };
    }
  }

  private static convertToEasternTime(date: Date): Date {
    // Convert to Eastern Time (accounting for DST)
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const easternOffset = this.getEasternOffset(date);
    return new Date(utc + easternOffset);
  }

  private static getEasternOffset(date: Date): number {
    // Simplified DST calculation for Eastern Time
    const year = date.getFullYear();
    const marchSecondSunday = this.getNthSundayOfMonth(year, 2, 2); // Second Sunday of March
    const novemberFirstSunday = this.getNthSundayOfMonth(year, 10, 1); // First Sunday of November
    
    if (date >= marchSecondSunday && date < novemberFirstSunday) {
      return -4 * 60 * 60 * 1000; // EDT (UTC-4)
    } else {
      return -5 * 60 * 60 * 1000; // EST (UTC-5)
    }
  }

  private static getNthSundayOfMonth(year: number, month: number, n: number): Date {
    const firstDay = new Date(year, month, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(1 + (7 - firstDay.getDay()) % 7);
    return new Date(firstSunday.setDate(firstSunday.getDate() + (n - 1) * 7));
  }

  private static formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5); // "HH:MM"
  }

  private static isMarketHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return this.MARKET_HOLIDAYS_2024.includes(dateStr);
  }

  private static getNextMarketOpen(currentDate: Date): Date {
    let nextDate = new Date(currentDate);
    
    // If it's after market hours today, try tomorrow
    if (this.formatTime(currentDate) >= this.US_MARKET_SCHEDULE.regularClose) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    // Find next weekday that's not a holiday
    while (nextDate.getDay() === 0 || nextDate.getDay() === 6 || this.isMarketHoliday(nextDate)) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    // Set to market open time
    const [hours, minutes] = this.US_MARKET_SCHEDULE.regularOpen.split(':');
    nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return nextDate;
  }

  private static getNextMarketClose(currentDate: Date): Date {
    const closeDate = new Date(currentDate);
    const [hours, minutes] = this.US_MARKET_SCHEDULE.regularClose.split(':');
    closeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return closeDate;
  }

  static shouldMakeApiCall(): boolean {
    const marketHours = this.getCurrentMarketHours();
    // Allow API calls during market hours and pre/after hours for real-time data
    return marketHours.currentStatus !== 'closed';
  }

  static getMarketStatusMessage(): string {
    const marketHours = this.getCurrentMarketHours();
    
    switch (marketHours.currentStatus) {
      case 'open':
        return `Market is open. Closes at ${this.US_MARKET_SCHEDULE.regularClose} ET`;
      case 'pre-market':
        return `Pre-market trading. Market opens at ${this.US_MARKET_SCHEDULE.regularOpen} ET`;
      case 'after-hours':
        return `After-hours trading. Market opens tomorrow at ${this.US_MARKET_SCHEDULE.regularOpen} ET`;
      case 'closed':
        const nextOpen = marketHours.nextOpen;
        if (nextOpen) {
          return `Market is closed. Opens ${nextOpen.toLocaleDateString()} at ${this.US_MARKET_SCHEDULE.regularOpen} ET`;
        }
        return 'Market is closed';
      default:
        return 'Market status unknown';
    }
  }
}
