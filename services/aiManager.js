const { OpenAI } = require("openai");
const Anthropic = require("@anthropic-ai/sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

/**
 * Multi-Model AI Service Manager
 * Intelligently routes queries to different AI providers based on:
 * - Query complexity
 * - Cost optimization  
 * - Model availability
 * - Performance requirements
 */
class AIManager {
  constructor() {
    // Initialize AI providers
    this.providers = {
      openai: null,
      claude: null,
      gemini: null
    };
    
    // Model performance tracking
    this.modelStats = {
      openai: { requests: 0, errors: 0, avgResponseTime: 0 },
      claude: { requests: 0, errors: 0, avgResponseTime: 0 },
      gemini: { requests: 0, errors: 0, avgResponseTime: 0 }
    };
    
    // Initialize available providers
    this.initializeProviders();
    
    // Model routing configuration
    this.routingConfig = {
      // Simple queries - use faster/cheaper models
      simple: ['gemini', 'openai', 'claude'],
      // Complex reasoning - use more capable models
      complex: ['claude', 'openai', 'gemini'],
      // Code generation - use specialized models
      code: ['openai', 'claude', 'gemini'],
      // Default fallback order
      default: ['openai', 'claude', 'gemini']
    };
  }

  /**
   * Initialize AI providers based on available API keys
   */
  initializeProviders() {
    // Reset providers
    this.providers = {
      openai: null,
      claude: null,
      gemini: null
    };
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      console.log("✅ OpenAI initialized");
    }

    // Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.claude = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      console.log("✅ Claude initialized");
    }

    // Google Gemini
    if (process.env.GOOGLE_API_KEY) {
      this.providers.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      console.log("✅ Gemini initialized");
    }

    const availableProviders = Object.keys(this.providers).filter(p => this.providers[p]);
    console.log(`🤖 AI Manager initialized with ${availableProviders.length} providers: ${availableProviders.join(', ')}`);
  }

  /**
   * Analyze query complexity to determine best model
   */
  analyzeQueryComplexity(prompt) {
    const complexityIndicators = {
      simple: [
        'show', 'list', 'find', 'get', 'count', 'total',
        'status', 'latest', 'recent', 'today', 'yesterday'
      ],
      complex: [
        'analyze', 'correlate', 'predict', 'recommend', 'optimize',
        'pattern', 'anomaly', 'trend', 'insight', 'cause', 'impact',
        'compare', 'relationship', 'dependency'
      ],
      code: [
        'elasticsearch', 'dsl', 'query', 'json', 'filter',
        'bool', 'terms', 'range', 'match'
      ]
    };

    const lowerPrompt = prompt.toLowerCase();
    
    // Count indicators for each category
    const scores = {
      simple: complexityIndicators.simple.filter(word => lowerPrompt.includes(word)).length,
      complex: complexityIndicators.complex.filter(word => lowerPrompt.includes(word)).length,
      code: complexityIndicators.code.filter(word => lowerPrompt.includes(word)).length
    };

    // Determine primary category
    const maxScore = Math.max(...Object.values(scores));
    const category = Object.keys(scores).find(key => scores[key] === maxScore) || 'default';
    
    return {
      category,
      scores,
      confidence: maxScore / (lowerPrompt.split(' ').length)
    };
  }

  /**
   * Get the best available model for a query
   */
  getBestModel(prompt, preferredProvider = null) {
    if (preferredProvider && this.providers[preferredProvider]) {
      return preferredProvider;
    }

    // Check for temporary user preference (from frontend)
    if (this.routingConfig.temp_user_preference) {
      const userPreferredProvider = this.routingConfig.temp_user_preference[0];
      if (userPreferredProvider && this.providers[userPreferredProvider]) {
        console.log(`🎯 Using user-selected model: ${userPreferredProvider}`);
        return userPreferredProvider;
      }
    }

    const analysis = this.analyzeQueryComplexity(prompt);
    const preferredOrder = this.routingConfig[analysis.category] || this.routingConfig.default;
    
    // Find first available provider in preferred order
    for (const provider of preferredOrder) {
      if (this.providers[provider]) {
        return provider;
      }
    }

    // Fallback to any available provider
    const available = Object.keys(this.providers).filter(p => this.providers[p]);
    return available[0] || 'openai';
  }

  /**
   * Execute query with OpenAI
   */
  async queryOpenAI(prompt, options = {}) {
    const startTime = Date.now();
    try {
      const response = await this.providers.openai.chat.completions.create({
        model: options.model || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      });
      
      const responseTime = Date.now() - startTime;
      this.updateStats('openai', responseTime, false);
      
      return {
        content: response.choices[0].message.content.trim(),
        provider: 'openai',
        model: options.model || "gpt-4",
        usage: response.usage,
        responseTime
      };
    } catch (error) {
      this.updateStats('openai', Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Execute query with Claude
   */
  async queryClaude(prompt, options = {}) {
    const startTime = Date.now();
    try {
      const response = await this.providers.claude.messages.create({
        model: options.model || "claude-3-sonnet-20240229",
        max_tokens: options.maxTokens || 2000,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature || 0.7
      });
      
      const responseTime = Date.now() - startTime;
      this.updateStats('claude', responseTime, false);
      
      return {
        content: response.content[0].text,
        provider: 'claude',
        model: options.model || "claude-3-sonnet-20240229",
        usage: response.usage,
        responseTime
      };
    } catch (error) {
      this.updateStats('claude', Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Execute query with Gemini
   */
  async queryGemini(prompt, options = {}) {
    const startTime = Date.now();
    try {
      const model = this.providers.gemini.getGenerativeModel({ 
        model: options.model || "gemini-pro" 
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const responseTime = Date.now() - startTime;
      this.updateStats('gemini', responseTime, false);
      
      return {
        content: response.text(),
        provider: 'gemini',
        model: options.model || "gemini-pro",
        usage: result.usage || {},
        responseTime
      };
    } catch (error) {
      this.updateStats('gemini', Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Update performance statistics
   */
  updateStats(provider, responseTime, isError) {
    const stats = this.modelStats[provider];
    stats.requests++;
    if (isError) {
      stats.errors++;
    }
    
    // Update average response time
    stats.avgResponseTime = ((stats.avgResponseTime * (stats.requests - 1)) + responseTime) / stats.requests;
  }

  /**
   * Main query method with intelligent routing and fallback
   */
  async query(prompt, options = {}) {
    const { preferredProvider, enableFallback = true, ...queryOptions } = options;
    
    // Determine best model
    const primaryProvider = this.getBestModel(prompt, preferredProvider);
    const analysis = this.analyzeQueryComplexity(prompt);
    
    console.log(`🎯 Query routed to ${primaryProvider} (complexity: ${analysis.category}, confidence: ${analysis.confidence.toFixed(2)})`);
    
    try {
      // Try primary provider
      switch (primaryProvider) {
        case 'openai':
          return await this.queryOpenAI(prompt, queryOptions);
        case 'claude':
          return await this.queryClaude(prompt, queryOptions);
        case 'gemini':
          return await this.queryGemini(prompt, queryOptions);
        default:
          throw new Error(`Unknown provider: ${primaryProvider}`);
      }
    } catch (error) {
      console.error(`❌ ${primaryProvider} failed:`, error.message);
      
      if (!enableFallback) {
        throw error;
      }
      
      // Try fallback providers
      const fallbackProviders = Object.keys(this.providers)
        .filter(p => p !== primaryProvider && this.providers[p]);
      
      for (const fallbackProvider of fallbackProviders) {
        try {
          console.log(`🔄 Falling back to ${fallbackProvider}`);
          switch (fallbackProvider) {
            case 'openai':
              return await this.queryOpenAI(prompt, queryOptions);
            case 'claude':
              return await this.queryClaude(prompt, queryOptions);
            case 'gemini':
              return await this.queryGemini(prompt, queryOptions);
          }
        } catch (fallbackError) {
          console.error(`❌ ${fallbackProvider} fallback failed:`, fallbackError.message);
          continue;
        }
      }
      
      throw new Error(`All AI providers failed. Original error: ${error.message}`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      providers: Object.keys(this.providers).filter(p => this.providers[p]),
      performance: this.modelStats,
      routing: this.routingConfig
    };
  }

  /**
   * Legacy compatibility method
   */
  async askLLM(prompt, options = {}) {
    const result = await this.query(prompt, options);
    return result.content;
  }
}

// Create singleton instance
const aiManager = new AIManager();

module.exports = { 
  AIManager, 
  aiManager,
  // Legacy export for backward compatibility
  askLLM: (prompt, options) => aiManager.askLLM(prompt, options)
};