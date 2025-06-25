
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { setStockServiceConfig, getStockService } from '@/services/stock';
import { useToast } from '@/hooks/use-toast';

const StockProviderSelector: React.FC = () => {
  const [provider, setProvider] = useState<'mock' | 'finnhub' | 'alpha-vantage'>('mock');
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

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          Stock Data Provider
          <Badge variant="outline" className="border-green-600 text-green-400">
            {currentService.getCurrentProvider()}
          </Badge>
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
            </SelectContent>
          </Select>
        </div>
        
        {provider !== 'mock' && (
          <div>
            <label className="text-sm text-slate-300 mb-2 block">API Key</label>
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
        
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong>Mock:</strong> Random data for testing</p>
          <p><strong>Finnhub:</strong> Real-time data, 60 req/min free</p>
          <p><strong>Alpha Vantage:</strong> Real-time data, 25 req/day free</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockProviderSelector;
