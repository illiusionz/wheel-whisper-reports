
export interface AIResponse {
  content: string;
  confidence: number;
}

export async function callClaudeAPI(apiKey: string, prompt: string, maxTokens: number): Promise<AIResponse> {
  const requestId = crypto.randomUUID();
  console.log(`🧠 [${requestId}] CLAUDE API CALL START`);
  console.log(`🔑 [${requestId}] API Key validation:`, {
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    startsCorrectly: apiKey?.startsWith('sk-ant-') || false,
    promptLength: prompt?.length || 0,
    maxTokens: maxTokens
  });
  
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
  };
  
  console.log(`📤 [${requestId}] Request configuration:`, {
    model: requestBody.model,
    max_tokens: requestBody.max_tokens,
    temperature: requestBody.temperature,
    messageLength: requestBody.messages[0].content.length
  });
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [${requestId}] Request timeout after 45 seconds`);
      controller.abort();
    }, 45000); // Increased timeout to 45 seconds
    
    const startTime = Date.now();
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
    const fetchTime = Date.now() - startTime;

    console.log(`📨 [${requestId}] Claude API Response:`, {
      status: response.status,
      ok: response.ok,
      fetchTime: `${fetchTime}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${requestId}] Claude API Error:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Claude API authentication failed. Please verify your ANTHROPIC_API_KEY in Supabase secrets.');
      } else if (response.status === 400) {
        let errorMessage = 'Claude API request error';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        throw new Error(`Claude API request error: ${errorMessage}`);
      } else if (response.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error(`Claude API server error (${response.status}): Service temporarily unavailable`);
      } else {
        throw new Error(`Claude API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    const parseTime = Date.now() - startTime;
    
    console.log(`📊 [${requestId}] Response data analysis:`, {
      hasContent: !!data.content,
      contentType: Array.isArray(data.content) ? 'array' : typeof data.content,
      contentLength: data.content?.length || 0,
      parseTime: `${parseTime}ms`
    });
    
    // Enhanced content extraction
    let content = '';
    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      const textContent = data.content.find(item => item.type === 'text');
      content = textContent?.text || data.content[0]?.text || '';
    } else if (typeof data.content === 'string') {
      content = data.content;
    }
    
    console.log(`📝 [${requestId}] Content extraction:`, {
      extractedLength: content.length,
      preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    });
    
    if (!content || typeof content !== 'string') {
      console.error(`❌ [${requestId}] Invalid content:`, {
        originalContent: data.content,
        extractedContent: content
      });
      throw new Error('Claude API returned invalid or empty content');
    }
    
    if (content.trim().length === 0) {
      throw new Error('Claude API returned empty analysis content');
    }
    
    console.log(`✅ [${requestId}] Claude analysis completed successfully:`, {
      finalContentLength: content.length,
      totalTime: `${parseTime}ms`
    });
    
    return {
      content: content.trim(),
      confidence: 0.85
    };
    
  } catch (error) {
    console.error(`💥 [${requestId}] Claude API Error:`, {
      name: error?.name || 'Unknown',
      message: error?.message || 'No message',
      stack: error?.stack || 'No stack'
    });
    
    if (error.name === 'AbortError') {
      throw new Error('Claude API request timed out after 45 seconds. Please try again.');
    }
    
    if (error.message?.includes('fetch')) {
      throw new Error('Failed to connect to Claude API. Please check your internet connection.');
    }
    
    throw error;
  }
}
