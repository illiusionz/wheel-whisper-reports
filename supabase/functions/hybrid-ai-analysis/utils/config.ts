
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface AIProvider {
  name: string;
  model: string;
  confidence: number;
}

export const selectOptimalProvider = (
  analysisType: string,
  requiresRealTime: boolean = false,
  forceModel?: string,
  excludeProviders: string[] = []
): AIProvider => {
  // If a specific model is forced, use it
  if (forceModel) {
    if (forceModel.includes('claude')) {
      return { name: 'claude', model: 'claude-3-5-sonnet-20241022', confidence: 0.85 };
    } else if (forceModel.includes('gpt') || forceModel.includes('openai')) {
      return { name: 'openai', model: 'gpt-4o-mini', confidence: 0.82 };
    } else if (forceModel.includes('perplexity')) {
      return { name: 'perplexity', model: 'llama-3.1-sonar-large-128k-online', confidence: 0.80 };
    }
  }

  // Filter out excluded providers
  const availableProviders = [
    { name: 'claude', model: 'claude-3-5-sonnet-20241022', confidence: 0.85 },
    { name: 'openai', model: 'gpt-4o-mini', confidence: 0.82 },
    { name: 'perplexity', model: 'llama-3.1-sonar-large-128k-online', confidence: 0.80 }
  ].filter(provider => !excludeProviders.includes(provider.name));

  // Select based on analysis type and real-time requirements
  switch (analysisType) {
    case 'news':
    case 'sentiment':
      // Perplexity is best for real-time news and sentiment
      return availableProviders.find(p => p.name === 'perplexity') || availableProviders[0];
    
    case 'technical':
    case 'options':
    case 'risk':
      // Claude excels at technical and quantitative analysis
      return availableProviders.find(p => p.name === 'claude') || availableProviders[0];
    
    default:
      // Default to Claude for general analysis
      return availableProviders.find(p => p.name === 'claude') || availableProviders[0];
  }
};

export const getAPIKey = (provider: string): { key: string; source: string } => {
  let apiKey: string | undefined;
  let keySource: string;
  
  switch (provider) {
    case 'perplexity':
      apiKey = Deno.env.get('PERPLEXITY_API_KEY');
      keySource = 'PERPLEXITY_API_KEY';
      break;
    case 'openai':
      apiKey = Deno.env.get('OPENAI_API_KEY');
      keySource = 'OPENAI_API_KEY';
      break;
    case 'claude':
    default:
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      keySource = 'ANTHROPIC_API_KEY';
      
      if (!apiKey) {
        apiKey = Deno.env.get('CLAUDE_API_KEY');
        keySource = 'CLAUDE_API_KEY';
      }
      
      if (!apiKey) {
        apiKey = Deno.env.get('ANTHROPIC_KEY');
        keySource = 'ANTHROPIC_KEY';
      }
      break;
  }
  
  if (!apiKey) {
    throw new Error(`${keySource} not configured. Please add it to your Supabase Edge Function secrets.`);
  }
  
  return { key: apiKey, source: keySource };
};
