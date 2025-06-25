
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'feature';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console and external service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', showDetails = false } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {level === 'page' ? 'Application Error' : 'Component Error'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-red-600 dark:text-red-400">
                {level === 'page' 
                  ? 'Something went wrong with the application. Please try refreshing the page.'
                  : 'This component encountered an error. You can try reloading it or continue using other parts of the app.'
                }
              </p>
              
              {showDetails && error && (
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded text-sm font-mono text-red-800 dark:text-red-200">
                  <p className="font-semibold">Error: {error.message}</p>
                  {errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="mt-2 text-xs overflow-auto">{errorInfo.componentStack}</pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                {level === 'page' && (
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
