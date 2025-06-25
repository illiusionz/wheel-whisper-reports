
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  stage?: string;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

export interface DataFreshness {
  lastUpdated: Date;
  isStale: boolean;
  staleDuration: number;
  maxAge: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: Array<'error' | 'warning' | 'info' | 'success'>;
  delivery: Array<'toast' | 'email' | 'push'>;
  quiet?: boolean;
}

export interface UserInterface {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  animations: boolean;
  soundEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}
