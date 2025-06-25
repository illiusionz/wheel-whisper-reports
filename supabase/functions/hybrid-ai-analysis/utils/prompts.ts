
export function buildContextPrompt(analysisType: string, symbol: string, data: any): string {
  const baseContext = `You are an expert financial analyst providing detailed analysis for ${symbol}.`
  
  switch (analysisType) {
    case 'technical':
      return `${baseContext}
      
Current Stock Data: ${JSON.stringify(data, null, 2)}

Provide comprehensive technical analysis for ${symbol}:

**Technical Analysis for ${symbol}**

**Current Price Action:**
- Price: $${data.price}
- Change: ${data.change} (${data.changePercent?.toFixed(2)}%)

**Key Technical Levels:**
- Support and resistance levels
- Volume analysis and patterns
- Momentum indicators and trend direction

**Trading Recommendations:**
- Entry and exit points
- Risk management suggestions
- Price targets and stop losses

Provide specific, actionable technical analysis with clear insights.`

    case 'sentiment':
      return `${baseContext}
      
Current Stock Data: ${JSON.stringify(data, null, 2)}

Provide market sentiment analysis for ${symbol}:

**Market Sentiment Analysis for ${symbol}**

**Current Market Sentiment:**
- Overall market mood and trader sentiment
- Recent news impact and reactions
- Social media sentiment and retail behavior

**Key Sentiment Drivers:**
- Recent earnings or announcements
- Sector trends and peer performance
- Macroeconomic factors

**Sentiment Indicators:**
- Options flow and unusual activity
- Institutional vs retail sentiment
- Fear & greed indicators

Provide comprehensive sentiment analysis with specific insights.`

    case 'options':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide options strategy analysis:

**Options Strategy Analysis for ${symbol}**

**Current Options Environment:**
- Implied volatility levels
- Options flow analysis
- Put/call ratios

**Strategy Recommendations:**
- Specific options strategies
- Strike selection and timing
- Risk/reward profiles

**Risk Management:**
- Position sizing recommendations
- Exit strategies
- Hedging considerations

Give specific options strategies with actionable recommendations.`

    case 'risk':
      return `${baseContext}
      
Stock Data: ${JSON.stringify(data, null, 2)}

Provide risk assessment:

**Risk Assessment for ${symbol}**

**Volatility Analysis:**
- Historical and implied volatility
- Beta and correlation analysis
- Risk-adjusted metrics

**Key Risk Factors:**
- Company-specific risks
- Sector and market risks
- Macroeconomic factors

**Risk Management:**
- Position sizing recommendations
- Diversification strategies
- Hedging approaches

Provide detailed risk analysis with mitigation strategies.`

    default:
      return `${baseContext}
      
Analyze ${symbol} with current data: ${JSON.stringify(data, null, 2)}
      
Provide comprehensive financial analysis with specific insights and actionable recommendations.`
  }
}
