import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, Zap, Clock, Sparkles, Settings, ChevronDown, RefreshCw } from 'lucide-react';
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
  claude: { icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/10', name: 'Claude' },
  openai: { icon: Sparkles, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', name: 'OpenAI' },
  perplexity: { icon: Zap, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', name: 'Perplexity' }
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

  const formatAnalysisContent = (content: string) => {
    // Split content by headers and bullet points
    const lines = content.split('\n').filter(line => line.trim());
    const formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Main headers (### or ####)
      if (line.startsWith('###') || line.startsWith('####')) {
        const headerText = line.replace(/^#+\s*/, '').replace(/#+$/, '').trim();
        formatted.push({ type: 'header', content: headerText });
        continue;
      }
      
      // Bold headers (**text**) - convert to subheaders
      if (line.match(/^\*\*[^*]+\*\*:?\s*$/)) {
        const headerText = line.replace(/\*\*/g, '').replace(/:$/, '').trim();
        formatted.push({ type: 'subheader', content: headerText });
        continue;
      }
      
      // Bullet points
      if (line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./)) {
        const bulletText = line.replace(/^[•-]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        formatted.push({ type: 'bullet', content: bulletText });
        continue;
      }
      
      // Regular text paragraphs
      formatted.push({ type: 'text', content: line });
    }
    
    return formatted;
  };

  const highlightNumbers = (text: string) => {
    // First handle inline bold text (**text**) by converting to styled spans
    let processedText = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-slate-100 font-semibold bg-slate-700/30 px-2 py-0.5 rounded text-sm">$1</strong>');
    
    // Then handle numbers, percentages, and currencies
    return processedText.split(/(\$[\d,]+\.?\d*|[\d,]+\.?\d*%|[\d,]+\.?\d*|\b\d{4}\b|\[\d+\]|<strong[^>]*>.*?<\/strong>)/g).map((part, index) => {
      // Skip already processed bold text
      if (part.includes('<strong')) {
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      }
      
      // Dollar amounts
      if (/^\$[\d,]+\.?\d*$/.test(part)) {
        return <span key={index} className="text-emerald-400 font-semibold bg-emerald-400/10 px-1.5 py-0.5 rounded text-sm">{part}</span>;
      }
      // Percentages
      if (/^[\d,]+\.?\d*%$/.test(part)) {
        const isNegative = processedText.includes('-' + part) || processedText.includes('(' + part);
        return <span key={index} className={`font-semibold px-1.5 py-0.5 rounded text-sm ${isNegative ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>{part}</span>;
      }
      // Regular numbers
      if (/^[\d,]+\.?\d*$/.test(part) && part.length > 2) {
        return <span key={index} className="text-cyan-400 font-semibold bg-cyan-400/10 px-1.5 py-0.5 rounded text-sm">{part}</span>;
      }
      // Years
      if (/^\b\d{4}\b$/.test(part)) {
        return <span key={index} className="text-blue-400 font-medium bg-blue-400/10 px-1.5 py-0.5 rounded text-sm">{part}</span>;
      }
      // References [1], [2], etc.
      if (/^\[\d+\]$/.test(part)) {
        return <span key={index} className="text-slate-400 text-xs bg-slate-700/30 px-1 py-0.5 rounded">{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (error) {
    return null; // Gracefully hide on error
  }

  const modelInfo = analysis?.model ? modelIcons[analysis.model as keyof typeof modelIcons] : null;

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 h-[600px] flex flex-col">
      {/* Gradient overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative pb-3 space-y-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/20">
                <Brain className="h-4 w-4 text-purple-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                {title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Hybrid AI
                </Badge>
                {modelInfo && (
                  <Badge variant="outline" className={`text-xs border-slate-600 ${modelInfo.bgColor} ${modelInfo.color}`}>
                    <modelInfo.icon className="h-3 w-3 mr-1" />
                    {modelInfo.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {allowModelSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="h-8 w-8 p-0 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        {showModelSelector && allowModelSelection && (
          <div className="animate-fade-in bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
              <SelectTrigger className="h-9 text-xs bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700 transition-colors">
                <SelectValue placeholder="Choose AI model" />
                <ChevronDown className="h-3 w-3 opacity-50" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="auto" className="text-slate-300 hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full" />
                    Auto (Smart Routing)
                  </div>
                </SelectItem>
                <SelectItem value="claude" className="text-slate-300 hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3 text-purple-400" />
                    Claude (Advanced Analysis)
                  </div>
                </SelectItem>
                <SelectItem value="openai" className="text-slate-300 hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    OpenAI (Balanced)
                  </div>
                </SelectItem>
                <SelectItem value="perplexity" className="text-slate-300 hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-cyan-400" />
                    Perplexity (Real-time)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative pt-0 flex-1 overflow-hidden">
        {!hasAnalyzed ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/20">
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-200">AI-Powered Analysis</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {selectedModel === 'auto' 
                  ? 'Smart routing will select the optimal AI model for best results' 
                  : `Analysis will be performed using ${selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)}`
                }
              </p>
            </div>
            
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
          </div>
        ) : (
          <div className="space-y-4 h-full flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-6 border border-slate-600/30 backdrop-blur-sm">
                <div className="space-y-4">
                  {formatAnalysisContent(analysis.content).map((section, index) => (
                    <div key={index}>
                      {section.type === 'header' && (
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-600/30">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full"></div>
                          <h3 className="text-slate-100 font-bold text-base tracking-tight">
                            {section.content}
                          </h3>
                        </div>
                      )}
                      
                      {section.type === 'subheader' && (
                        <div className="flex items-center gap-3 mb-3 mt-6 p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
                          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex-shrink-0"></div>
                          <h4 className="text-slate-100 font-semibold text-sm tracking-wide uppercase letter-spacing-wider">
                            {section.content}
                          </h4>
                        </div>
                      )}
                      
                      {section.type === 'bullet' && (
                        <div className="flex items-start gap-3 mb-3 ml-4 p-2 hover:bg-slate-800/30 rounded-md transition-colors">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-slate-300 text-sm leading-relaxed">
                            {highlightNumbers(section.content)}
                          </div>
                        </div>
                      )}
                      
                      {section.type === 'text' && (
                        <div className="text-slate-300 text-sm leading-relaxed mb-3 pl-2">
                          {highlightNumbers(section.content)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">
                    {new Date(analysis.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="w-1 h-1 bg-slate-600 rounded-full" />
                <Badge variant="outline" className="text-xs border-slate-600 bg-slate-800/50 text-slate-300 font-medium">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                  {Math.round(analysis.confidence * 100)}% confidence
                </Badge>
              </div>
              
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/50 transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </>
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
