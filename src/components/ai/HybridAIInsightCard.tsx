import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Loader2, Zap, Clock, Sparkles, Settings, ChevronDown, RefreshCw, AlertCircle, CheckCircle, WifiOff, Database } from 'lucide-react';
import { useHybridAI } from '@/hooks/useHybridAI';
import { enrichDataForAnalysis, validateDataCompleteness, type EnrichedAnalysisData } from '@/utils/dataEnrichment';

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
  const { getHybridAnalysis, isLoading, error, isServiceAvailable, circuitBreakerStats } = useHybridAI();
  const [analysis, setAnalysis] = useState<any>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'auto' | 'claude' | 'openai' | 'perplexity'>('auto');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dataValidation, setDataValidation] = useState<any>(null);

  const handleAnalyze = useCallback(async () => {
    if (isLoading) return;
    
    const requestId = crypto.randomUUID();
    console.log(`🎯 [${requestId}] HybridAIInsightCard: Starting analysis...`, {
      symbol,
      analysisType,
      selectedModel,
      retryCount,
      rawData: data,
      timestamp: new Date().toISOString()
    });
    
    // Enrich data for better analysis
    const enrichedData = enrichDataForAnalysis(data, analysisType);
    const validation = validateDataCompleteness(enrichedData, analysisType);
    
    console.log(`📊 [${requestId}] Data enrichment results:`, {
      enrichedData,
      validation,
      dataCompleteness: validation.isComplete ? 'complete' : 'partial'
    });
    
    setDataValidation(validation);
    setDebugInfo({
      requestId,
      startTime: new Date().toISOString(),
      symbol,
      analysisType,
      selectedModel,
      retryCount,
      dataEnrichment: {
        originalFields: Object.keys(data || {}),
        enrichedFields: Object.keys(enrichedData),
        completeness: validation.isComplete,
        missingFields: validation.missingFields,
        warnings: validation.warnings
      },
      status: 'starting'
    });
    
    try {
      const forceModel = selectedModel === 'auto' ? undefined : selectedModel;
      const result = await getHybridAnalysis(analysisType, symbol, enrichedData, requiresRealTime, forceModel);
      
      console.log(`📊 [${requestId}] HybridAIInsightCard: Analysis result:`, {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
        contentLength: result?.content?.length || 0,
        model: result?.model,
        confidence: result?.confidence
      });
      
      setDebugInfo(prev => ({
        ...prev,
        status: result ? 'success' : 'failed',
        endTime: new Date().toISOString(),
        resultReceived: !!result,
        resultMetadata: result?.metadata
      }));
      
      if (result) {
        setAnalysis(result);
        setHasAnalyzed(true);
        setRetryCount(0);
        console.log(`✅ [${requestId}] HybridAIInsightCard: Analysis completed successfully`);
      } else {
        setRetryCount(prev => prev + 1);
        console.log(`❌ [${requestId}] HybridAIInsightCard: No result received but no error thrown`);
      }
    } catch (err: any) {
      setRetryCount(prev => prev + 1);
      console.error(`💥 [${requestId}] HybridAIInsightCard: Analysis error:`, {
        error: err,
        message: err?.message,
        stack: err?.stack?.substring(0, 500)
      });
      
      setDebugInfo(prev => ({
        ...prev,
        status: 'error',
        endTime: new Date().toISOString(),
        error: err?.message,
        errorType: err?.name
      }));
    }
  }, [getHybridAnalysis, analysisType, symbol, data, requiresRealTime, selectedModel, isLoading, retryCount]);

  // Reset analysis when symbol changes
  useEffect(() => {
    setAnalysis(null);
    setHasAnalyzed(false);
    setDebugInfo(null);
    setRetryCount(0);
    setDataValidation(null);
  }, [symbol]);

  const formatAnalysisContent = useCallback((content: string) => {
    if (!content) return [];
    
    const lines = content.split('\n').filter(line => line.trim());
    const formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      if (line.startsWith('###') || line.startsWith('####')) {
        const headerText = line.replace(/^#+\s*/, '').replace(/#+$/, '').trim();
        formatted.push({ type: 'header', content: headerText });
        continue;
      }
      
      if (line.match(/^\*\*[^*]+\*\*:?\s*$/)) {
        const headerText = line.replace(/\*\*/g, '').replace(/:$/, '').trim();
        formatted.push({ type: 'subheader', content: headerText });
        continue;
      }
      
      if (line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./)) {
        const bulletText = line.replace(/^[•-]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        formatted.push({ type: 'bullet', content: bulletText });
        continue;
      }
      
      formatted.push({ type: 'text', content: line });
    }
    
    return formatted;
  }, []);

  const highlightNumbers = useCallback((text: string) => {
    if (!text) return text;
    
    let processedText = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded text-sm border border-emerald-500/20">$1</strong>');
    
    return processedText.split(/(\$[\d,]+\.?\d*|[\d,]+\.?\d*%|[\d,]+\.?\d*|\b\d{4}\b|\[\d+\]|<strong[^>]*>.*?<\/strong>)/g).map((part, index) => {
      if (part.includes('<strong')) {
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      }
      
      if (/^\$[\d,]+\.?\d*$/.test(part)) {
        return <span key={index} className="text-emerald-400 font-semibold bg-emerald-400/10 px-1.5 py-0.5 rounded text-sm">{part}</span>;
      }
      if (/^[\d,]+\.?\d*%$/.test(part)) {
        const isNegative = processedText.includes('-' + part) || processedText.includes('(' + part);
        return <span key={index} className={`font-semibold px-1.5 py-0.5 rounded text-sm ${isNegative ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>{part}</span>;
      }
      if (/^[\d,]+\.?\d*$/.test(part) && part.length > 2) {
        return <span key={index} className="text-cyan-400 font-semibold bg-cyan-400/10 px-1.5 py-0.5 rounded text-sm">{part}</span>;
      }
      if (/^\b\d{4}\b$/.test(part)) {
        return <span key={index} className="text-blue-400 font-medium bg-blue-400/10 px-1.5 py-0.5 rounded text-sm">{part}</span>;
      }
      if (/^\[\d+\]$/.test(part)) {
        return <span key={index} className="text-slate-400 text-xs bg-slate-700/30 px-1 py-0.5 rounded">{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  }, []);

  const modelInfo = analysis?.model ? modelIcons[analysis.model as keyof typeof modelIcons] : null;

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 h-[700px] flex flex-col">
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
                {dataValidation && (
                  <Badge variant="outline" className={`text-xs border-slate-600 ${
                    dataValidation.isComplete ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    <Database className="h-3 w-3 mr-1" />
                    {dataValidation.isComplete ? 'Complete Data' : 'Partial Data'}
                  </Badge>
                )}
                {!isServiceAvailable && (
                  <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 bg-red-500/10">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Service Unavailable
                  </Badge>
                )}
                {debugInfo && (
                  <Badge variant="outline" className={`text-xs border-slate-600 ${
                    debugInfo.status === 'success' ? 'bg-green-500/10 text-green-400' :
                    debugInfo.status === 'error' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {debugInfo.status === 'success' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                     debugInfo.status === 'error' ? <AlertCircle className="h-3 w-3 mr-1" /> :
                     <Clock className="h-3 w-3 mr-1" />
                    }
                    {debugInfo.status}
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
      
      <CardContent className="relative pt-0 flex-1 flex flex-col min-h-0">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <h4 className="text-red-400 font-medium text-sm">Analysis Error</h4>
                <p className="text-red-300 text-xs mt-1">{error}</p>
                {retryCount > 0 && (
                  <p className="text-red-400/60 text-xs mt-1">Attempt #{retryCount}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="mb-4 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
            <div className="text-xs text-slate-400">
              <div className="font-medium text-slate-300 mb-1">Debug Info:</div>
              <div>Status: <span className="text-slate-200">{debugInfo.status}</span></div>
              <div>Model: <span className="text-slate-200">{selectedModel}</span></div>
              <div>Symbol: <span className="text-slate-200">{debugInfo.symbol}</span></div>
              <div>Request ID: <span className="text-slate-200 font-mono text-xs">{debugInfo.requestId?.substring(0, 8)}...</span></div>
              {debugInfo.dataEnrichment && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <div>Data Quality: <span className="text-slate-200">{debugInfo.dataEnrichment.completeness ? 'Complete' : 'Partial'}</span></div>
                  <div>Original Fields: <span className="text-slate-200">{debugInfo.dataEnrichment.originalFields?.length || 0}</span></div>
                  <div>Enriched Fields: <span className="text-slate-200">{debugInfo.dataEnrichment.enrichedFields?.length || 0}</span></div>
                  {debugInfo.dataEnrichment.warnings?.length > 0 && (
                    <div>Warnings: <span className="text-yellow-300">{debugInfo.dataEnrichment.warnings.join(', ')}</span></div>
                  )}
                </div>
              )}
              {debugInfo.error && <div>Error: <span className="text-red-300">{debugInfo.error}</span></div>}
              {circuitBreakerStats && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <div>Circuit Breaker: <span className="text-slate-200">{circuitBreakerStats.state || 'unknown'}</span></div>
                  <div>Total Requests: <span className="text-slate-200">{circuitBreakerStats.totalRequests || 0}</span></div>
                  <div>Success Rate: <span className="text-slate-200">
                    {circuitBreakerStats.totalRequests ? 
                      Math.round((circuitBreakerStats.successfulRequests / circuitBreakerStats.totalRequests) * 100) : 0}%
                  </span></div>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasAnalyzed ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
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
                {dataValidation && !dataValidation.isComplete && (
                  <p className="text-xs text-yellow-400 max-w-xs mx-auto">
                    Some data is missing but analysis can still provide valuable insights.
                  </p>
                )}
                {!isServiceAvailable && (
                  <p className="text-xs text-red-400 max-w-xs mx-auto">
                    Service temporarily unavailable. Please try again in a moment.
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleAnalyze}
                disabled={isLoading || !isServiceAvailable}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : !isServiceAvailable ? (
                  <>
                    <WifiOff className="h-4 w-4 mr-2" />
                    Service Unavailable
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Smart Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : hasAnalyzed && analysis ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <ScrollArea className="flex-1 min-h-0">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-6 border border-slate-600/30 backdrop-blur-sm">
                <div className="space-y-4">
                  {analysis?.content && formatAnalysisContent(analysis.content).map((section, index) => (
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
                        <div className="mb-3 mt-6 p-4 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full flex-shrink-0"></div>
                            <h4 className="text-purple-200 font-bold text-sm tracking-wide uppercase letter-spacing-wider">
                              {section.content}
                            </h4>
                          </div>
                        </div>
                      )}
                      
                      {section.type === 'bullet' && (
                        <div className="flex items-start gap-3 mb-3 ml-4 p-3 hover:bg-slate-800/30 rounded-md transition-colors">
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
                    {analysis?.timestamp ? new Date(analysis.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
                <div className="w-1 h-1 bg-slate-600 rounded-full" />
                <Badge variant="outline" className="text-xs border-slate-600 bg-slate-800/50 text-slate-300 font-medium">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                  {analysis?.confidence ? Math.round(analysis.confidence * 100) : 0}% confidence
                </Badge>
              </div>
              
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !isServiceAvailable}
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/50 transition-all duration-200 font-medium disabled:opacity-50"
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
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-red-200">Analysis Failed</h3>
                <p className="text-xs text-red-400 max-w-xs mx-auto">
                  Unable to complete analysis. Please try again.
                </p>
              </div>
              
              <Button 
                onClick={handleAnalyze}
                disabled={isLoading || !isServiceAvailable}
                variant="outline"
                className="border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Analysis
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
