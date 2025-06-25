
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Loader2, Zap, Clock, Sparkles, Settings } from 'lucide-react';
import { useHybridAI } from '@/hooks/useHybridAI';

interface HybridAIInsightCardProps {
  symbol: string;
  analysisType: 'technical' | 'options' | 'risk' | 'general' | 'news' | 'sentiment';
  data: any;
  title: string;
  requiresRealTime?: boolean;
  allowModelSelection?: boolean;
}

const modelIcons = {
  claude: { icon: Sparkles, color: 'text-purple-500', name: 'Claude' },
  openai: { icon: Brain, color: 'text-green-500', name: 'OpenAI' },
  perplexity: { icon: Zap, color: 'text-blue-500', name: 'Perplexity' }
};

const HybridAIInsightCard: React.FC<HybridAIInsightCardProps> = ({ 
  symbol, 
  analysisType, 
  data, 
  title,
  requiresRealTime = false,
  allowModelSelection = true
}) => {
  const { getHybridAnalysis, isLoading, error } = useHybridAI();
  const [analysis, setAnalysis] = useState<any>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'auto' | 'claude' | 'openai' | 'perplexity'>('auto');
  const [showModelSelector, setShowModelSelector] = useState(false);

  const handleAnalyze = async () => {
    if (isLoading) return;
    
    const forceModel = selectedModel === 'auto' ? undefined : selectedModel;
    const result = await getHybridAnalysis(analysisType, symbol, data, requiresRealTime, forceModel);
    if (result) {
      setAnalysis(result);
      setHasAnalyzed(true);
    }
  };

  if (error) {
    return null; // Gracefully hide on error
  }

  const modelInfo = analysis?.model ? modelIcons[analysis.model as keyof typeof modelIcons] : null;

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            {allowModelSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="h-6 w-6 p-0 hover:bg-indigo-100"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
            {modelInfo && (
              <Badge variant="outline" className="text-xs">
                <modelInfo.icon className={`h-3 w-3 mr-1 ${modelInfo.color}`} />
                {modelInfo.name}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-indigo-600">
              <Sparkles className="h-3 w-3" />
              Hybrid AI
            </div>
          </div>
        </CardTitle>
        
        {showModelSelector && allowModelSelection && (
          <div className="mt-2">
            <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Smart Routing)</SelectItem>
                <SelectItem value="claude">Claude (Best for Analysis)</SelectItem>
                <SelectItem value="openai">OpenAI (Balanced)</SelectItem>
                <SelectItem value="perplexity">Perplexity (Real-time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {!hasAnalyzed ? (
          <div className="text-center py-4">
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Smart Analysis
                </>
              )}
            </Button>
            <p className="text-xs text-indigo-600 mt-2">
              {selectedModel === 'auto' ? 'Uses optimal AI model for best results' : `Using ${selectedModel.toUpperCase()}`}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-indigo-700 leading-relaxed mb-3">{analysis.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-indigo-500">
                  <Clock className="h-3 w-3" />
                  {new Date(analysis.timestamp).toLocaleTimeString()}
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(analysis.confidence * 100)}% confidence
                </Badge>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HybridAIInsightCard;
