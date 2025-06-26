
import { corsHeaders } from './config.ts';

export interface RequestValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
}

export const validateAndParseRequest = async (request: Request): Promise<RequestValidationResult> => {
  console.log('🔍 Validating request:', {
    method: request.method,
    hasBody: request.body !== null,
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length')
  });

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return {
      isValid: false,
      error: 'OPTIONS_REQUEST'
    };
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return {
      isValid: false,
      error: `Method ${request.method} not allowed. Only POST requests are supported.`
    };
  }

  // Check content type
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {
      isValid: false,
      error: 'Content-Type must be application/json'
    };
  }

  try {
    // Get request text first
    const requestText = await request.text();
    console.log('📝 Request body text:', {
      length: requestText.length,
      isEmpty: requestText.trim() === '',
      preview: requestText.substring(0, 200)
    });

    // Check if body is empty
    if (!requestText || requestText.trim() === '') {
      return {
        isValid: false,
        error: 'Request body is empty. Please provide analysis parameters.'
      };
    }

    // Parse JSON
    let requestData;
    try {
      requestData = JSON.parse(requestText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return {
        isValid: false,
        error: `Invalid JSON format: ${parseError.message}`
      };
    }

    // Validate required fields
    const requiredFields = ['analysisType', 'symbol', 'data'];
    const missingFields = requiredFields.filter(field => !requestData[field]);
    
    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    console.log('✅ Request validation successful:', {
      analysisType: requestData.analysisType,
      symbol: requestData.symbol,
      hasData: !!requestData.data,
      dataKeys: Object.keys(requestData.data || {})
    });

    return {
      isValid: true,
      data: requestData
    };

  } catch (error) {
    console.error('❌ Request validation error:', error);
    return {
      isValid: false,
      error: `Request processing failed: ${error.message}`
    };
  }
};

export const createErrorResponse = (error: string, status: number = 400) => {
  console.error(`❌ Returning error response (${status}):`, error);
  
  return new Response(
    JSON.stringify({ 
      error,
      timestamp: new Date().toISOString(),
      status
    }),
    {
      status,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
};

export const createSuccessResponse = (data: any) => {
  console.log('✅ Returning success response:', {
    hasContent: !!data.content,
    model: data.model,
    contentLength: data.content?.length || 0
  });

  return new Response(
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      status: 'success'
    }),
    {
      status: 200,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
};
