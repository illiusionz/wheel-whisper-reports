
import { getAPIKey } from '../utils/config.ts';
import { AIResponse } from './claude.ts';

export const callPerplexity = async (prompt: string, options: {
  maxTokens?: number;
  temperature?: number;
  model?: string;
} = {}): Promise<AIResponse> => {
  const { maxTokens = 2000, temperature = 0.3, model = 'llama-3.1-sonar-large-128k-online' } = options;
  
  console.log('🤖 Calling Perplexity API:', { model, maxTokens, temperature });
  
  const { key: apiKey } = getAPIKey('perplexity');
  
  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a financial analyst providing detailed, comprehensive analysis. Always provide complete responses with specific insights and actionable recommendations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature,
    top_p: 0.9,
    max_tokens: Math.min(maxTokens, 4000)
  };

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('📊 Perplexity response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Perplexity API error ${response.status}:`, errorText);
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content || '';
  
  console.log('✅ Perplexity content length:', content.length);
  
  return {
    content,
    confidence: 0.80,
    metadata: {
      model,
      usage: data.usage,
      finishReason: data.choices[0].finish_reason
    }
  };
};
