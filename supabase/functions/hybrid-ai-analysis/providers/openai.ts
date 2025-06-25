
import { AIResponse } from './claude.ts'

export async function callOpenAIAPI(apiKey: string, prompt: string, maxTokens: number): Promise<AIResponse> {
  console.log('=== OPENAI API CALL START ===')
  console.log('API Key length:', apiKey.length)
  console.log('Prompt length:', prompt.length)
  console.log('Max tokens:', maxTokens)
  
  const requestBody = {
    model: 'gpt-4o-mini',
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
    max_tokens: Math.min(maxTokens, 4000),
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  console.log('OpenAI response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`OpenAI API error ${response.status}:`, errorText)
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('OpenAI API response received successfully')
  
  const content = data.choices[0].message.content || ''
  console.log('OpenAI content length:', content.length)
  
  return {
    content,
    confidence: 0.82
  }
}
