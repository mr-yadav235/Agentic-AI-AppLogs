class Memory {
  constructor() {
    // Conversation history with user
    this.conversationHistory = [];
    
    // Context from recent queries
    this.queryContext = {
      recentQueries: [],
      recentResults: [],
      currentTimeRange: null,
      currentFilters: {},
      sessionStartTime: new Date().toISOString()
    };
    
    // Log patterns and insights learned over time
    this.logPatterns = {
      commonErrors: new Map(),
      frequentServices: new Map(),
      timePatterns: new Map(),
      correlatedEvents: []
    };
    
    // User preferences and session state
    this.userPreferences = {
      defaultTimeRange: '1h',
      preferredLogLevel: null,
      favoriteServices: [],
      outputFormat: 'summary'
    };
    
    // Maximum items to keep in memory (prevent memory leaks)
    this.maxHistorySize = 50;
    this.maxQueryContextSize = 20;
  }

  // Add a conversation turn to memory
  addConversationTurn(userQuery, botResponse, metadata = {}) {
    const turn = {
      timestamp: new Date().toISOString(),
      userQuery,
      botResponse,
      metadata: {
        ...metadata,
        queryType: this.classifyQuery(userQuery),
        responseTime: metadata.responseTime || null
      }
    };

    this.conversationHistory.push(turn);
    
    // Maintain size limit
    if (this.conversationHistory.length > this.maxHistorySize) {
      this.conversationHistory.shift();
    }
  }

  // Store query context for follow-up questions
  addQueryContext(query, dslQuery, results, metadata = {}) {
    // Handle both old array format and new structured format
    let resultCount = 0;
    if (results && results.logs && Array.isArray(results.logs)) {
      resultCount = results.logs.length;
    } else if (Array.isArray(results)) {
      resultCount = results.length;
    }
    
    const context = {
      timestamp: new Date().toISOString(),
      originalQuery: query,
      dslQuery,
      resultCount,
      totalFound: results && results.total ? results.total : resultCount,
      metadata: {
        ...metadata,
        executionTime: metadata.executionTime || null
      }
    };

    this.queryContext.recentQueries.push(context);
    
    // Extract and store relevant filters/timerange
    this.extractContextFromDSL(dslQuery);
    
    // Learn from the results
    this.learnFromResults(results, query);
    
    // Maintain size limit
    if (this.queryContext.recentQueries.length > this.maxQueryContextSize) {
      this.queryContext.recentQueries.shift();
    }
  }

  // Extract useful context from Elasticsearch DSL
  extractContextFromDSL(dslQuery) {
    try {
      const dsl = typeof dslQuery === 'string' ? JSON.parse(dslQuery) : dslQuery;
      
      // Extract time range
      if (dsl.query?.bool?.filter?.range?.['@timestamp']) {
        this.queryContext.currentTimeRange = dsl.query.bool.filter.range['@timestamp'];
      }
      
      // Extract service filters
      if (dsl.query?.bool?.filter?.term?.['service.keyword']) {
        this.queryContext.currentFilters.service = dsl.query.bool.filter.term['service.keyword'];
      }
      
      // Extract log level filters
      if (dsl.query?.bool?.filter?.term?.['level.keyword']) {
        this.queryContext.currentFilters.level = dsl.query.bool.filter.term['level.keyword'];
      }
    } catch (error) {
      console.log('Could not parse DSL for context extraction:', error.message);
    }
  }

  // Learn patterns from query results
  learnFromResults(results, originalQuery) {
    // Handle both old array format and new structured format
    let logs = [];
    if (results && results.logs && Array.isArray(results.logs)) {
      logs = results.logs;
    } else if (Array.isArray(results)) {
      logs = results;
    } else {
      return;
    }
    
    // Track common error patterns
    if (originalQuery.toLowerCase().includes('error')) {
      logs.forEach(log => {
        if (log.level === 'ERROR' || log.level === 'WARN') {
          const errorKey = this.extractErrorPattern(log.message);
          const count = this.logPatterns.commonErrors.get(errorKey) || 0;
          this.logPatterns.commonErrors.set(errorKey, count + 1);
        }
      });
    }
    
    // Track service frequency
    logs.forEach(log => {
      if (log.service && log.service !== 'unknown') {
        const count = this.logPatterns.frequentServices.get(log.service) || 0;
        this.logPatterns.frequentServices.set(log.service, count + 1);
      }
    });
  }

  // Extract error pattern from log message
  extractErrorPattern(message) {
    if (!message) return 'unknown_error';
    
    // Remove specific details like IDs, timestamps, etc.
    return message
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
      .replace(/\b\d+\b/g, '[NUMBER]')
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[UUID]')
      .substring(0, 100); // Keep first 100 chars for pattern
  }

  // Classify the type of user query
  classifyQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('error') || lowerQuery.includes('exception') || lowerQuery.includes('fail')) {
      return 'error_investigation';
    } else if (lowerQuery.includes('performance') || lowerQuery.includes('slow') || lowerQuery.includes('latency')) {
      return 'performance_analysis';
    } else if (lowerQuery.includes('count') || lowerQuery.includes('how many')) {
      return 'metric_query';
    } else if (lowerQuery.includes('when') || lowerQuery.includes('time') || lowerQuery.includes('between')) {
      return 'temporal_query';
    } else if (lowerQuery.includes('service') || lowerQuery.includes('application')) {
      return 'service_query';
    } else {
      return 'general_search';
    }
  }

  // Get context for enhancing current query
  getQueryEnhancementContext(currentQuery) {
    const context = {
      isFollowUp: this.isFollowUpQuery(currentQuery),
      previousFilters: this.queryContext.currentFilters,
      previousTimeRange: this.queryContext.currentTimeRange,
      recentQueryTypes: this.getRecentQueryTypes(),
      suggestedServices: this.getSuggestedServices(),
      commonErrorPatterns: Array.from(this.logPatterns.commonErrors.keys()).slice(0, 5)
    };
    
    return context;
  }

  // Detect if current query is a follow-up to previous queries
  isFollowUpQuery(query) {
    const followUpIndicators = [
      'also', 'and', 'what about', 'how about', 'same time', 'same service',
      'related', 'similar', 'more', 'other', 'different', 'compare'
    ];
    
    return followUpIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    );
  }

  // Get recent query types for context
  getRecentQueryTypes() {
    return this.conversationHistory
      .slice(-5)
      .map(turn => turn.metadata.queryType)
      .filter(type => type);
  }

  // Get suggested services based on frequency
  getSuggestedServices() {
    return Array.from(this.logPatterns.frequentServices.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([service]) => service);
  }

  // Get conversation summary for context
  getConversationSummary(lastN = 5) {
    return this.conversationHistory
      .slice(-lastN)
      .map(turn => ({
        query: turn.userQuery,
        queryType: turn.metadata.queryType,
        timestamp: turn.timestamp
      }));
  }

  // Update user preferences based on usage patterns
  updateUserPreferences(preferences = {}) {
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences,
      lastUpdated: new Date().toISOString()
    };
  }

  // Get insights and recommendations
  getInsights() {
    const insights = {
      topErrors: Array.from(this.logPatterns.commonErrors.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([pattern, count]) => ({ pattern, count })),
      
      topServices: Array.from(this.logPatterns.frequentServices.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([service, count]) => ({ service, count })),
      
      queryPatterns: this.getQueryTypeDistribution(),
      sessionDuration: this.getSessionDuration()
    };
    
    return insights;
  }

  // Get distribution of query types in this session
  getQueryTypeDistribution() {
    const distribution = {};
    this.conversationHistory.forEach(turn => {
      const type = turn.metadata.queryType;
      if (type) {
        distribution[type] = (distribution[type] || 0) + 1;
      }
    });
    return distribution;
  }

  // Calculate session duration
  getSessionDuration() {
    const startTime = new Date(this.queryContext.sessionStartTime);
    const currentTime = new Date();
    return Math.round((currentTime - startTime) / 1000 / 60); // minutes
  }

  // Clear memory (useful for new sessions)
  clearMemory() {
    this.conversationHistory = [];
    this.queryContext.recentQueries = [];
    this.queryContext.recentResults = [];
    this.queryContext.currentTimeRange = null;
    this.queryContext.currentFilters = {};
    this.queryContext.sessionStartTime = new Date().toISOString();
  }

  // Get memory statistics
  getMemoryStats() {
    return {
      conversationTurns: this.conversationHistory.length,
      queryContextItems: this.queryContext.recentQueries.length,
      learnedErrorPatterns: this.logPatterns.commonErrors.size,
      trackedServices: this.logPatterns.frequentServices.size,
      sessionDuration: this.getSessionDuration()
    };
  }
}

// Singleton instance for the application
const memoryInstance = new Memory();

module.exports = {
  Memory,
  memoryInstance
};
