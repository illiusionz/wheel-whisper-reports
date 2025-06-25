
export interface AIResponse {
  content: string;
  confidence: number;
}

export async function callClaudeAPI(apiKey: string, prompt: string, maxTokens: number): Promise<AIResponse> {
  console.log('=== CLAUDE API CALL START ===')
  console.log('API Key length:', apiKey.length)
  console.log('API Key starts with sk-ant-:', apiKey.startsWith('sk-ant-'))
  console.log('Prompt length:', prompt.length)
  console.log('Max tokens requested:', maxTokens)
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: Math.min(maxTokens, 4000),
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  }
  
  console.log('Making request to Claude API...')
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('=== CLAUDE API RESPONSE ===')
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== CLAUDE API ERROR DETAILS ===')
      console.error(`Status: ${response.status}`)
      console.error(`Error Response Body: ${errorText}`)
      
      if (response.status === 401) {
        throw new Error('Claude API authentication failed. The API key is invalid or expired. Please verify your ANTHROPIC_API_KEY in Supabase secrets.')
      } else if (response.status === 400) {
        throw new Error(`Claude API request error: ${errorText}`)
      } else if (response.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`Claude API error (${response.status}): ${errorText}`)
      }
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    
    if (!content) {
      console.error('=== EMPTY CONTENT FROM CLAUDE ===')
      throw new Error('Claude API returned empty content')
    }
    
    console.log('✅ Claude analysis completed successfully')
    console.log('Content length:', content.length)
    
    return {
      content,
      confidence: 0.85
    }
    
  } catch (error) {
    console.error('=== ERROR IN CLAUDE API CALL ===')
    console.error('Error message:', error.message)
    throw error
  }
}
