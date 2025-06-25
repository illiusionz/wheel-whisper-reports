
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, Zap, Clock } from 'lucide-react';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';

interface AIInsightCardProps {
  symbol: string;
  analysisType: 'technical' | 'options' | 'risk' | 'general';
  data: any;
  title: string;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ 
  symbol, 
  analysisType, 
  data, 
  title 
}) => {
  const { getAIAnalysis, isLoading, error } = useAIAnalysis();
  const [analysis, setAnalysis] = useState<string>('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);

  const handleAnalyze = async () => {
    if (isLoading) return;
    
    const result = await getAIAnalysis(symbol, analysisType, data);
    if (result) {
      setAnalysis(result.analysis);
      setHasAnalyzed(true);
      setLastAnalysisTime(new Date());
    }
  };

  const canAnalyzeAgain = () => {
    if (!lastAnalysisTime) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastAnalysisTime < fiveMinutesAgo;
  };

  if (error) {
    return null; // Gracefully hide on error
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {title}
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Zap className="h-3 w-3" />
            AI
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasAnalyzed ? (
          <div className="text-center py-4">
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Get AI Analysis
                </>
              )}
            </Button>
            <p className="text-xs text-blue-600 mt-2">
              Click to get AI-powered insights (~$0.01)
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-blue-700 leading-relaxed mb-3">{analysis}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-blue-500">
                <Clock className="h-3 w-3" />
                {lastAnalysisTime?.toLocaleTimeString()}
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !canAnalyzeAgain()}
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : canAnalyzeAgain() ? (
                  'Refresh'
                ) : (
                  'Wait 5min'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightCard;
