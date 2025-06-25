
import React, { createContext, useContext, useState, useCallback } from 'react';

interface RealTimeDataSettings {
  globalRefreshInterval: number;
  enableGlobalAutoRefresh: boolean;
  watchlistRefreshInterval: number;
  reportRefreshInterval: number;
}

interface RealTimeDataContextType {
  settings: RealTimeDataSettings;
  updateSettings: (newSettings: Partial<RealTimeDataSettings>) => void;
  isGlobalRefreshPaused: boolean;
  pauseGlobalRefresh: () => void;
  resumeGlobalRefresh: () => void;
}

const defaultSettings: RealTimeDataSettings = {
  globalRefreshInterval: 30000, // 30 seconds
  enableGlobalAutoRefresh: true,
  watchlistRefreshInterval: 15000, // 15 seconds for watchlist
  reportRefreshInterval: 60000, // 1 minute for detailed reports
};

const RealTimeDataContext = createContext<RealTimeDataContextType | undefined>(undefined);

export const RealTimeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RealTimeDataSettings>(defaultSettings);
  const [isGlobalRefreshPaused, setIsGlobalRefreshPaused] = useState(false);

  const updateSettings = useCallback((newSettings: Partial<RealTimeDataSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    console.log('Real-time data settings updated:', newSettings);
  }, []);

  const pauseGlobalRefresh = useCallback(() => {
    setIsGlobalRefreshPaused(true);
    console.log('Global refresh paused');
  }, []);

  const resumeGlobalRefresh = useCallback(() => {
    setIsGlobalRefreshPaused(false);
    console.log('Global refresh resumed');
  }, []);

  return (
    <RealTimeDataContext.Provider value={{
      settings,
      updateSettings,
      isGlobalRefreshPaused,
      pauseGlobalRefresh,
      resumeGlobalRefresh
    }}>
      {children}
    </RealTimeDataContext.Provider>
  );
};

export const useRealTimeDataContext = () => {
  const context = useContext(RealTimeDataContext);
  if (context === undefined) {
    throw new Error('useRealTimeDataContext must be used within a RealTimeDataProvider');
  }
  return context;
};
