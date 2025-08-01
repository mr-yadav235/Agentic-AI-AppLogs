const { convertToElasticDSL } = require('./planner');
const { executeDSL } = require('./executor');
const { memoryInstance } = require('../memory/memory');

// Beautiful response formatter
function formatLogResponse(logData, originalQuery) {
  if (!logData || !logData.logs || logData.logs.length === 0) {
    return `🔍 **No logs found** matching your query: "${originalQuery}"`;
  }

  const { total, logs, took } = logData;
  
  // Create header with summary
  let response = `📊 **Log Search Results**\n`;
  response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  response += `🔍 Query: "${originalQuery}"\n`;
  response += `📈 Found: ${total} total logs (showing ${logs.length})\n`;
  response += `⚡ Search time: ${took}ms\n\n`;

  // Group logs by level for better organization
  const logsByLevel = logs.reduce((acc, log) => {
    const level = log.level || 'INFO';
    if (!acc[level]) acc[level] = [];
    acc[level].push(log);
    return acc;
  }, {});

  // Format logs by level with appropriate icons
  const levelIcons = {
    'ERROR': '🔴',
    'WARN': '🟡', 
    'WARNING': '🟡',
    'INFO': '🔵',
    'DEBUG': '🟢',
    'TRACE': '⚪'
  };

  Object.entries(logsByLevel).forEach(([level, levelLogs]) => {
    const icon = levelIcons[level] || '📄';
    response += `${icon} **${level} Logs (${levelLogs.length})**\n`;
    response += `${'-'.repeat(30)}\n`;
    
    levelLogs.forEach((log, index) => {
      const timestamp = formatTimestamp(log.timestamp);
      const service = log.service !== 'unknown' ? `[${log.service}]` : '';
      
      response += `• ${timestamp} ${service}\n`;
      response += `  ${log.message}\n`;
      
      if (index < levelLogs.length - 1) {
        response += `\n`;
      }
    });
    response += `\n`;
  });

  // Add helpful footer
  response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  response += `💡 *Tip: Ask follow-up questions like "show more details" or "what about errors from user-service"*`;

  return response;
}

// Format timestamp to be more readable
function formatTimestamp(timestamp) {
  if (!timestamp) return '🕐 Unknown time';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '🕐 Just now';
    if (diffMins < 60) return `🕐 ${diffMins}m ago`;
    if (diffHours < 24) return `🕐 ${diffHours}h ago`;
    if (diffDays < 7) return `🕐 ${diffDays}d ago`;
    
    return `🕐 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  } catch (error) {
    return `🕐 ${timestamp}`;
  }
}

// Format error responses beautifully
function formatErrorResponse(error, originalQuery) {
  return `❌ **Error Processing Query**\n` +
         `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
         `🔍 Query: "${originalQuery}"\n` +
         `💥 Error: ${error}\n\n` +
         `💡 *Try rephrasing your query or check if the log indices are available*`;
}

async function runAgent(naturalQuery, sessionId = 'default') {
  const startTime = Date.now();
  
  try {
    // Get context from memory to enhance the query
    const context = memoryInstance.getQueryEnhancementContext(naturalQuery);
    
    // Convert to DSL with enhanced context
    const dsl = await convertToElasticDSL(naturalQuery, context);
    console.log("Generated DSL:", dsl);
    
    // Execute the query
    const result = await executeDSL(dsl);
    const executionTime = Date.now() - startTime;
    
    // Store the query context in memory
    memoryInstance.addQueryContext(naturalQuery, dsl, result, {
      executionTime,
      sessionId
    });
    
    // Format the response beautifully
    const response = formatLogResponse(result, naturalQuery);
    
    // Add conversation turn to memory
    memoryInstance.addConversationTurn(naturalQuery, response, {
      responseTime: executionTime,
      sessionId,
      resultCount: result && result.logs ? result.logs.length : 0
    });
    
    return response;
    
  } catch (error) {
    const errorResponse = formatErrorResponse(error.message, naturalQuery);
    
    // Still record the failed attempt in memory
    memoryInstance.addConversationTurn(naturalQuery, errorResponse, {
      error: error.message,
      sessionId
    });
    
    return errorResponse;
  }
}

// Get enhanced agent with memory insights
async function runAgentWithInsights(naturalQuery, sessionId = 'default') {
  const result = await runAgent(naturalQuery, sessionId);
  const insights = memoryInstance.getInsights();
  
  return {
    response: result,
    insights,
    memoryStats: memoryInstance.getMemoryStats()
  };
}

// Get conversation summary
function getConversationSummary(lastN = 5) {
  return memoryInstance.getConversationSummary(lastN);
}

// Reset conversation for new session
function startNewSession() {
  memoryInstance.clearMemory();
  return "New session started. Memory cleared.";
}

module.exports = { 
  runAgent, 
  runAgentWithInsights,
  getConversationSummary,
  startNewSession,
  memoryInstance 
};
