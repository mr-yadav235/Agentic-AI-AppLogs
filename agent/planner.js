const { aiManager } = require('../services/aiManager');
const query = {
  "query": {
    "bool": {
      "filter": {
        "term": {
          
        }
      }
    }
  }
}
async function convertToElasticDSL(naturalQuery, context = {}) {
  let contextualInfo = '';
  
  // Add context from memory if available
  if (context.isFollowUp && Object.keys(context.previousFilters).length > 0) {
    contextualInfo += `\nContext from previous query:`;
    if (context.previousFilters.service) {
      contextualInfo += `\n- Previous service filter: ${context.previousFilters.service}`;
    }
    if (context.previousFilters.level) {
      contextualInfo += `\n- Previous log level: ${context.previousFilters.level}`;
    }
    if (context.previousTimeRange) {
      contextualInfo += `\n- Previous time range: ${JSON.stringify(context.previousTimeRange)}`;
    }
  }
  
  if (context.suggestedServices && context.suggestedServices.length > 0) {
    contextualInfo += `\nFrequently queried services: ${context.suggestedServices.join(', ')}`;
  }
  
  if (context.recentQueryTypes && context.recentQueryTypes.length > 0) {
    const queryTypeContext = context.recentQueryTypes.join(', ');
    contextualInfo += `\nRecent query types: ${queryTypeContext}`;
  }
  
  if (context.commonErrorPatterns && context.commonErrorPatterns.length > 0) {
    contextualInfo += `\nCommon error patterns seen: ${context.commonErrorPatterns.slice(0, 2).join(', ')}`;
  }

  const prompt = `
You are an expert in Elasticsearch for application log analysis.
Convert the following log query into Elasticsearch DSL JSON.

Requirements:
- Use "bool" and "filter" for conditions.
- Use "term" with .keyword for exact string matches.
- Use "range" for time filters on @timestamp.
- Only use fields: @timestamp, service, level, message.
- Output ONLY valid JSON - no markdown, no code blocks, no explanations.
- Do NOT wrap the JSON in \`\`\`json or \`\`\` blocks.
- Consider the contextual information below when interpreting the query.

${contextualInfo}

Query: "${naturalQuery}"

Additional guidance:
- If this appears to be a follow-up query, consider reusing previous filters where appropriate.
- For error-related queries, focus on level: "ERROR" or "WARN".
- For performance queries, consider including recent time ranges.
- If no specific time is mentioned but context suggests continuation, use previous time range.
- For "yesterday" queries, use range filter with "gte": "now-1d/d", "lt": "now/d".

IMPORTANT: Return only the raw JSON object, starting with { and ending with }.
`;

console.log("PROMPT:", prompt);
  
  // Use AI manager with intelligent model routing for Elasticsearch DSL generation
  const aiResponse = await aiManager.query(prompt, {
    preferredProvider: 'openai', // OpenAI typically excels at structured JSON generation
    model: 'gpt-4',
    temperature: 0.3, // Lower temperature for more consistent JSON output
    maxTokens: 1500
  });
  
  const response = aiResponse.content;
  console.log(`🤖 DSL generated using ${aiResponse.provider} (${aiResponse.model}) in ${aiResponse.responseTime}ms`);
  
  // Clean up the response - remove markdown formatting if present
  let cleanedResponse = response.trim();
  
  // Remove ```json and ``` markers if they exist
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Validate that it's valid JSON before returning
  try {
    JSON.parse(cleanedResponse);
    console.log("Cleaned DSL:", cleanedResponse);
    return cleanedResponse;
  } catch (error) {
    console.error("Invalid JSON generated:", cleanedResponse);
    console.error("Parse error:", error.message);
    
    // Return a fallback basic query
    const fallbackQuery = {
      "query": {
        "bool": {
          "filter": [
            {
              "range": {
                "@timestamp": {
                  "gte": "now-1d",
                  "lte": "now"
                }
              }
            }
          ]
        }
      }
    };
    
    return JSON.stringify(fallbackQuery);
  }
}

module.exports = { convertToElasticDSL };
