
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (data && symbol) {
        const result = await getAIAnalysis(symbol, analysisType, data);
        if (result) {
          setAnalysis(result.analysis);
        }
      }
    };

    fetchAnalysis();
  }, [symbol, analysisType, data, getAIAnalysis]);

  if (error) {
    return null; // Gracefully hide on error
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing...</span>
          </div>
        ) : analysis ? (
          <p className="text-sm text-blue-700 leading-relaxed">{analysis}</p>
        ) : (
          <p className="text-sm text-blue-600 italic">AI analysis will appear here</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightCard;
