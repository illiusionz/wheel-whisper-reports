
import { AIResponse } from './claude.ts'

export async function callPerplexityAPI(apiKey: string, prompt: string, maxTokens: number): Promise<AIResponse> {
  console.log('=== PERPLEXITY API CALL START ===')
  console.log('API Key length:', apiKey.length)
  console.log('Prompt length:', prompt.length)
  console.log('Max tokens:', maxTokens)
  
  const requestBody = {
    model: 'llama-3.1-sonar-large-128k-online',
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
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: Math.min(maxTokens, 4000)
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log('Perplexity response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Perplexity API error ${response.status}:`, errorText)
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('Perplexity API response received successfully')
  
  const content = data.choices[0].message.content || ''
  console.log('Perplexity content length:', content.length)
  
  return {
    content,
    confidence: 0.80
  }
}
