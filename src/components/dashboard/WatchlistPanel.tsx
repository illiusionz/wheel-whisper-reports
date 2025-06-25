
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search, TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { MarketStatus } from '@/components/ui/market-status';
import { MarketHoursService } from '@/services/market/MarketHoursService';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface WatchlistPanelProps {
  watchlist: Stock[];
  onAddStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
}

const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  watchlist,
  onAddStock,
  onRemoveStock,
  onSelectStock,
  onRefresh,
  isRefreshing = false,
  lastUpdated
}) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      onAddStock(newSymbol.trim().toUpperCase());
      setNewSymbol('');
    }
  };

  const filteredWatchlist = watchlist.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shouldMakeApiCall = MarketHoursService.shouldMakeApiCall();

  return (
    <ErrorBoundary level="feature">
      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                  Stock Watchlist
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage your tracked U.S. stock tickers for MCP reports
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <MarketStatus />
                {onRefresh && (
                  <Button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Updating...' : 'Refresh'}
                  </Button>
                )}
              </div>
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!shouldMakeApiCall && (
              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700 rounded-lg">
                <div className="flex items-center text-amber-200 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  {MarketHoursService.getMarketStatusMessage()}
                </div>
              </div>
            )}

            <form onSubmit={handleAddStock} className="flex gap-2 mb-4">
              <Input
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Enter ticker symbol (e.g., AAPL, TSLA)"
                className="bg-slate-700 border-slate-600 text-white flex-1"
              />
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search watchlist..."
                className="bg-slate-700 border-slate-600 text-white pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredWatchlist.map((stock) => (
            <ErrorBoundary key={stock.symbol} level="component">
              <Card 
                className="bg-slate-800 border-slate-700 hover:bg-slate-750 cursor-pointer transition-colors"
                onClick={() => onSelectStock(stock.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{stock.symbol}</h3>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          Options
                        </Badge>
                        {!shouldMakeApiCall && (
                          <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                            Market Closed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 truncate">{stock.name}</p>
                    </div>
                    
                    <div className="text-right mr-3">
                      <p className="font-semibold text-white">${stock.price.toFixed(2)}</p>
                      <div className={`flex items-center text-sm ${
                        stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stock.change >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-400 hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStock(stock.symbol);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ErrorBoundary>
          ))}
        </div>

        {filteredWatchlist.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No stocks in watchlist</h3>
              <p className="text-slate-400">Add some U.S. stock tickers to get started with MCP reports</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default WatchlistPanel;
