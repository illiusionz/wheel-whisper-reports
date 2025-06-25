
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorInfo?: React.ErrorInfo;
}

export interface AppError extends Error {
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  component?: string;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: AppError) => void;
  showToast?: boolean;
  logError?: boolean;
}

export interface RetryState {
  count: number;
  maxRetries: number;
  lastAttempt: Date;
  canRetry: boolean;
  nextRetryIn?: number;
}
