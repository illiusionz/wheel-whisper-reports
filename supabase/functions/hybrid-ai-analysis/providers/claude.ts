
export interface AIResponse {
  content: string;
  confidence: number;
}

export async function callClaudeAPI(apiKey: string, prompt: string, maxTokens: number): Promise<AIResponse> {
  console.log('=== CLAUDE API CALL START ===')
  console.log('API Key length:', apiKey?.length || 0)
  console.log('API Key format valid:', apiKey?.startsWith('sk-ant-') || false)
  console.log('Prompt length:', prompt?.length || 0)
  console.log('Max tokens requested:', maxTokens)
  
  // Enhanced input validation
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Claude API key is required and must be a string');
  }
  
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('Invalid Claude API key format - must start with sk-ant-');
  }
  
  if (apiKey.length < 40) {
    throw new Error('Claude API key appears to be too short');
  }
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required and must be a non-empty string');
  }
  
  if (!maxTokens || maxTokens <= 0 || maxTokens > 4000) {
    throw new Error('Max tokens must be between 1 and 4000');
  }
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: Math.min(maxTokens, 4000),
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt.trim()
      }
    ]
  }
  
  console.log('Making request to Claude API...')
  console.log('Request model:', requestBody.model)
  console.log('Request max_tokens:', requestBody.max_tokens)
  console.log('Request temperature:', requestBody.temperature)
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Claude API request timeout after 30 seconds');
      controller.abort();
    }, 30000); // 30 second timeout - increased from 25
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('=== CLAUDE API RESPONSE ===')
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== CLAUDE API ERROR DETAILS ===')
      console.error(`Status: ${response.status}`)
      console.error(`Status Text: ${response.statusText}`)
      console.error(`Error Response Body: ${errorText}`)
      
      if (response.status === 401) {
        throw new Error('Claude API authentication failed. The API key is invalid, expired, or has insufficient permissions. Please verify your ANTHROPIC_API_KEY in Supabase secrets.')
      } else if (response.status === 400) {
        let errorMessage = 'Claude API request error';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        throw new Error(`Claude API request error: ${errorMessage}`)
      } else if (response.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later or upgrade your API plan.')
      } else if (response.status >= 500) {
        throw new Error(`Claude API server error (${response.status}): Service temporarily unavailable`)
      } else {
        throw new Error(`Claude API error (${response.status}): ${errorText}`)
      }
    }

    const data = await response.json()
    console.log('Response data structure:', {
      hasContent: !!data.content,
      contentLength: data.content?.length || 0,
      contentType: Array.isArray(data.content) ? 'array' : typeof data.content,
      contentFirstItem: data.content?.[0] ? typeof data.content[0] : 'N/A'
    })
    
    // Enhanced content extraction
    let content = '';
    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      // Claude's response format has content as an array of objects
      const textContent = data.content.find(item => item.type === 'text');
      content = textContent?.text || data.content[0]?.text || '';
    } else if (typeof data.content === 'string') {
      content = data.content;
    }
    
    console.log('Extracted content length:', content.length);
    console.log('Extracted content preview:', content.substring(0, 200));
    
    if (!content || typeof content !== 'string') {
      console.error('=== INVALID CONTENT FROM CLAUDE ===')
      console.error('Content received:', data.content)
      console.error('Extracted content:', content)
      throw new Error('Claude API returned invalid or empty content')
    }
    
    if (content.trim().length === 0) {
      console.error('=== EMPTY CONTENT FROM CLAUDE ===')
      throw new Error('Claude API returned empty analysis content')
    }
    
    console.log('✅ Claude analysis completed successfully')
    console.log('Final content length:', content.length)
    console.log('Final content preview:', content.substring(0, 100) + '...')
    
    return {
      content: content.trim(),
      confidence: 0.85
    }
    
  } catch (error) {
    console.error('=== ERROR IN CLAUDE API CALL ===')
    console.error('Error type:', error?.constructor?.name || 'Unknown')
    console.error('Error message:', error?.message || 'No message')
    console.error('Error stack:', error?.stack || 'No stack')
    
    // Enhanced error handling with more specific messages
    if (error.name === 'AbortError') {
      throw new Error('Claude API request timed out after 30 seconds. Please try again with a shorter prompt or check your internet connection.')
    }
    
    if (error.message?.includes('fetch')) {
      throw new Error('Failed to connect to Claude API. Please check your internet connection and try again.')
    }
    
    // Re-throw other errors as-is to preserve error messages
    throw error
  }
}
