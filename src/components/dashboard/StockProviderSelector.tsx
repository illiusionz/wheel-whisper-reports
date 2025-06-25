
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { setStockServiceConfig, getStockService } from '@/services/stock';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

const StockProviderSelector: React.FC = () => {
  const [provider, setProvider] = useState<'mock' | 'finnhub' | 'alpha-vantage' | 'polygon'>('mock');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleSetProvider = () => {
    try {
      setStockServiceConfig({
        provider,
        apiKey: apiKey || undefined,
        fallbackProvider: 'mock'
      });

      const service = getStockService();
      
      toast({
        title: "Provider Updated",
        description: `Switched to ${service.getCurrentProvider()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set provider",
        variant: "destructive",
      });
    }
  };

  const currentService = getStockService();
  const capabilities = currentService.getProviderCapabilities();

  const getApiKeyLink = () => {
    switch (provider) {
      case 'finnhub':
        return 'https://finnhub.io/register';
      case 'alpha-vantage':
        return 'https://www.alphavantage.co/support/#api-key';
      case 'polygon':
        return 'https://polygon.io/dashboard/api-keys';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Stock Data Provider
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-600 text-green-400">
                {currentService.getCurrentProvider()}
              </Badge>
              {capabilities.optionsData && (
                <Badge variant="outline" className="border-purple-600 text-purple-400">
                  Options
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Provider</label>
            <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="mock">Mock Data (Free)</SelectItem>
                <SelectItem value="finnhub">Finnhub (60 req/min free)</SelectItem>
                <SelectItem value="alpha-vantage">Alpha Vantage (25 req/day free)</SelectItem>
                <SelectItem value="polygon">Polygon.io (Professional)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {provider !== 'mock' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">API Key</label>
                {getApiKeyLink() && (
                  <a 
                    href={getApiKeyLink()!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                  >
                    Get API Key <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          )}
          
          <Button 
            onClick={handleSetProvider}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Set Provider
          </Button>
        </CardContent>
      </Card>

      {/* Provider Comparison */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Provider Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Basic Quotes</span>
                <Badge variant="outline" className="border-green-600 text-green-400">✓</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Historical Data</span>
                <Badge variant="outline" className={
                  capabilities.historicalData ? "border-green-600 text-green-400" : "border-slate-600 text-slate-400"
                }>
                  {capabilities.historicalData ? '✓' : '✗'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Options Data</span>
                <Badge variant="outline" className={
                  capabilities.optionsData ? "border-green-600 text-green-400" : "border-slate-600 text-slate-400"
                }>
                  {capabilities.optionsData ? '✓' : '✗'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Real-time Data</span>
                <Badge variant="outline" className={
                  capabilities.realTimeData ? "border-green-600 text-green-400" : "border-slate-600 text-slate-400"
                }>
                  {capabilities.realTimeData ? '✓' : '✗'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Wheel Strategy</span>
                <Badge variant="outline" className={
                  capabilities.wheelStrategy ? "border-purple-600 text-purple-400" : "border-slate-600 text-slate-400"
                }>
                  {capabilities.wheelStrategy ? '✓' : '✗'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">WebSockets</span>
                <Badge variant="outline" className={
                  capabilities.websockets ? "border-blue-600 text-blue-400" : "border-slate-600 text-slate-400"
                }>
                  {capabilities.websockets ? '✓' : '✗'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Provider Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-xs text-slate-400 space-y-1">
            <p><strong>Mock:</strong> Random data for testing - no API key needed</p>
            <p><strong>Finnhub:</strong> Real-time stock data - 60 requests/minute free tier</p>
            <p><strong>Alpha Vantage:</strong> Stock data with 25 requests/day free limit</p>
            <p><strong>Polygon.io:</strong> Professional-grade data with options, real-time streaming, and advanced features for wheel strategies</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockProviderSelector;
