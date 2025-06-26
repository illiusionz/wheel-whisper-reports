
import { getAPIKey } from '../utils/config.ts';

export interface AIResponse {
  content: string;
  confidence?: number;
  metadata?: any;
}

export const callClaude = async (prompt: string, options: {
  maxTokens?: number;
  temperature?: number;
  model?: string;
} = {}): Promise<AIResponse> => {
  const { maxTokens = 2000, temperature = 0.3, model = 'claude-3-5-sonnet-20241022' } = options;
  
  console.log('🤖 Calling Claude API:', { model, maxTokens, temperature });
  
  const { key: apiKey } = getAPIKey('claude');
  
  const requestBody = {
    model,
    max_tokens: Math.min(maxTokens, 4000),
    temperature,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody),
  });

  console.log('📊 Claude response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Claude API error ${response.status}:`, errorText);
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || '';
  
  console.log('✅ Claude content length:', content.length);
  
  return {
    content,
    confidence: 0.85,
    metadata: {
      model,
      usage: data.usage,
      stopReason: data.stop_reason
    }
  };
};
