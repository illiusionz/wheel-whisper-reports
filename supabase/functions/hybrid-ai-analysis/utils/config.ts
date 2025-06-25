
export function selectOptimalModel(analysisType: string, forceModel?: string): string {
  if (forceModel) {
    return forceModel
  }
  
  switch (analysisType) {
    case 'news':
    case 'sentiment':
      return 'perplexity'
    case 'technical':
    case 'options':
    case 'risk':
      return 'claude'
    default:
      return 'claude'
  }
}

export function getAPIKey(model: string): { key: string; source: string } {
  let apiKey: string | undefined
  let keySource: string
  
  switch (model) {
    case 'perplexity':
      apiKey = Deno.env.get('PERPLEXITY_API_KEY')
      keySource = 'PERPLEXITY_API_KEY'
      break
    case 'openai':
      apiKey = Deno.env.get('OPENAI_API_KEY')
      keySource = 'OPENAI_API_KEY'
      break
    case 'claude':
    default:
      apiKey = Deno.env.get('ANTHROPIC_API_KEY')
      keySource = 'ANTHROPIC_API_KEY'
      
      if (!apiKey) {
        apiKey = Deno.env.get('CLAUDE_API_KEY')
        keySource = 'CLAUDE_API_KEY'
      }
      
      if (!apiKey) {
        apiKey = Deno.env.get('ANTHROPIC_KEY')
        keySource = 'ANTHROPIC_KEY'
      }
      break
  }
  
  if (!apiKey) {
    throw new Error(`${keySource} not configured. Please add it to your Supabase Edge Function secrets.`)
  }
  
  return { key: apiKey, source: keySource }
}
