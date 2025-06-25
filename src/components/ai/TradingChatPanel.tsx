
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useTradingChat } from '@/hooks/useTradingChat';

interface TradingChatPanelProps {
  symbol?: string;
  context?: string;
}

const TradingChatPanel: React.FC<TradingChatPanelProps> = ({ symbol, context }) => {
  const [input, setInput] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const { messages, sendMessage, clearMessages, isLoading } = useTradingChat();

  const MAX_MESSAGES_PER_SESSION = 20;
  const remainingMessages = MAX_MESSAGES_PER_SESSION - messageCount;
  const isNearLimit = remainingMessages <= 5;
  const isAtLimit = remainingMessages <= 0;

  const handleSend = async () => {
    if (!input.trim() || isAtLimit || isLoading) return;
    
    const message = input.trim();
    setInput('');
    setMessageCount(prev => prev + 1);
    await sendMessage(message, symbol, context);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    clearMessages();
    setMessageCount(0);
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            MCP Trading Assistant
            {symbol && <span className="text-sm font-normal text-muted-foreground">({symbol})</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className={`${isNearLimit ? 'text-amber-600' : 'text-gray-500'}`}>
                {remainingMessages} left
              </span>
            </div>
            {messages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearChat}
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>
        {isNearLimit && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            <AlertCircle className="h-4 w-4" />
            {isAtLimit ? 'Message limit reached for this session' : `Only ${remainingMessages} messages remaining`}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6 pb-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ask me about wheel strategies, options analysis, or market insights!</p>
              {symbol && <p className="text-sm mt-2">I have context for {symbol}</p>}
              <p className="text-xs mt-3 text-amber-600">
                💡 Each conversation costs ~$0.05-0.10 in AI credits
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isAtLimit 
                  ? "Message limit reached" 
                  : `Ask about ${symbol || 'stocks, options, strategies'}...`
              }
              disabled={isLoading || isAtLimit}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading || isAtLimit}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChatPanel;
