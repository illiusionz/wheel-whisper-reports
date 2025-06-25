
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw } from 'lucide-react';

interface RealTimeErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  symbol?: string;
}

const RealTimeErrorFallback: React.FC<{ onRetry?: () => void; symbol?: string }> = ({ 
  onRetry, 
  symbol 
}) => (
  <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
    <CardHeader>
      <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
        <WifiOff className="h-5 w-5 mr-2" />
        Real-time Data Error
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <p className="text-orange-600 dark:text-orange-400">
          Unable to load real-time data{symbol ? ` for ${symbol}` : ''}. 
          This might be due to network issues or API rate limits.
        </p>
        
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export const RealTimeErrorBoundary: React.FC<RealTimeErrorBoundaryProps> = ({ 
  children, 
  onRetry, 
  symbol 
}) => {
  return (
    <ErrorBoundary
      level="feature"
      fallback={<RealTimeErrorFallback onRetry={onRetry} symbol={symbol} />}
      onError={(error, errorInfo) => {
        console.error('Real-time data error:', error, errorInfo);
        // Could integrate with monitoring service here
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
