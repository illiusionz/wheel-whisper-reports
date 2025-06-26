
import { getAPIKey } from '../utils/config.ts';

export interface AIResponse {
  content: string;
  confidence?: number;
  metadata?: any;
}

export const callOpenAI = async (prompt: string, options: {
  maxTokens?: number;
  temperature?: number;
  model?: string;
} = {}): Promise<AIResponse> => {
  const { maxTokens = 2000, temperature = 0.3, model = 'gpt-4o-mini' } = options;
  
  console.log('🤖 Calling OpenAI API:', { model, maxTokens, temperature });
  
  const { key: apiKey } = getAPIKey('openai');
  
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
    max_tokens: Math.min(maxTokens, 4000),
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('📊 OpenAI response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ OpenAI API error ${response.status}:`, errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content || '';
  
  console.log('✅ OpenAI content length:', content.length);
  
  return {
    content,
    confidence: 0.82,
    metadata: {
      model,
      usage: data.usage,
      finishReason: data.choices[0].finish_reason
    }
  };
};
