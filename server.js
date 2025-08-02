const express = require("express");
const cors = require("cors");
const { runAgent } = require("./agent/agent");
const { aiManager } = require("./services/aiManager");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post("/query", async (req, res) => {
  const { question, preferredModel } = req.body;
  
  try {
    // Store original AI manager preference for restoration
    const originalPreference = aiManager.routingConfig.default[0];
    let modelUsed = null;
    
    // Temporarily override model preference if specified
    if (preferredModel && preferredModel !== 'auto') {
      console.log(`🎯 User selected model: ${preferredModel}`);
      // Modify the AI manager routing to prefer the selected model
      aiManager.routingConfig.temp_user_preference = [preferredModel];
    }
    
    // Capture console.log output to extract model information
    const originalConsoleLog = console.log;
    let modelInfo = null;
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('🤖 DSL generated using')) {
        // Extract model info from the log message
        const match = message.match(/using (\w+) \(([^)]+)\)/);
        if (match) {
          modelInfo = {
            provider: match[1],
            model: match[2]
          };
        }
      }
      originalConsoleLog(...args);
    };
    
    // Run the agent
    const result = await runAgent(question);
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    // Clean up temporary routing preference
    if (aiManager.routingConfig.temp_user_preference) {
      delete aiManager.routingConfig.temp_user_preference;
    }
    
    // Determine which model was used
    modelUsed = modelInfo ? modelInfo.provider : (preferredModel !== 'auto' ? preferredModel : 'auto');
    
    console.log(`📊 Query processed using model: ${modelUsed}`);
    
    res.json({ 
      response: result,
      modelUsed: modelUsed,
      modelDetails: modelInfo,
      userPreference: preferredModel || 'auto',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      message: error.message 
    });
  }
});

// Multi-Model AI Endpoints
// ========================

// Test different AI models with the same prompt
app.post("/ai/compare", async (req, res) => {
  const { prompt, providers } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }
  
  const requestedProviders = providers || ['openai', 'claude', 'gemini'];
  const results = {};
  
  try {
    // Run queries in parallel for faster comparison
    const promises = requestedProviders.map(async (provider) => {
      try {
        const result = await aiManager.query(prompt, { 
          preferredProvider: provider,
          enableFallback: false 
        });
        return { provider, result };
      } catch (error) {
        return { 
          provider, 
          error: error.message,
          available: false 
        };
      }
    });
    
    const responses = await Promise.all(promises);
    
    responses.forEach(({ provider, result, error, available }) => {
      results[provider] = {
        success: !error,
        response: result?.content || null,
        model: result?.model || null,
        responseTime: result?.responseTime || null,
        usage: result?.usage || null,
        error: error || null,
        available: available !== false
      };
    });
    
    res.json({
      prompt,
      results,
      comparison: {
        fastest: Object.keys(results).reduce((fastest, provider) => 
          results[provider].responseTime && 
          (!fastest || results[provider].responseTime < results[fastest].responseTime) 
            ? provider : fastest, null),
        successful: Object.keys(results).filter(p => results[p].success)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI performance statistics
app.get("/ai/stats", (req, res) => {
  try {
    const stats = aiManager.getStats();
    res.json({
      timestamp: new Date().toISOString(),
      ...stats,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test AI model availability
app.get("/ai/health", async (req, res) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    providers: {}
  };
  
  try {
    const testPrompt = "Hello, please respond with 'OK' to confirm you're working.";
    const providers = ['openai', 'claude', 'gemini'];
    
    const promises = providers.map(async (provider) => {
      try {
        const startTime = Date.now();
        const result = await aiManager.query(testPrompt, {
          preferredProvider: provider,
          enableFallback: false,
          maxTokens: 10
        });
        
        return {
          provider,
          status: 'healthy',
          responseTime: Date.now() - startTime,
          model: result.model
        };
      } catch (error) {
        return {
          provider,
          status: 'error',
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      healthCheck.providers[result.provider] = {
        status: result.status,
        responseTime: result.responseTime || null,
        model: result.model || null,
        error: result.error || null
      };
    });
    
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    healthCheck.overall = healthyCount > 0 ? 'healthy' : 'degraded';
    healthCheck.availableProviders = healthyCount;
    healthCheck.totalProviders = providers.length;
    
    res.json(healthCheck);
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      overall: 'error'
    });
  }
});

// Query with specific AI provider
app.post("/ai/query/:provider", async (req, res) => {
  const { provider } = req.params;
  const { prompt, options = {} } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }
  
  try {
    const result = await aiManager.query(prompt, {
      preferredProvider: provider,
      enableFallback: false,
      ...options
    });
    
    res.json({
      success: true,
      provider: result.provider,
      model: result.model,
      response: result.content,
      responseTime: result.responseTime,
      usage: result.usage
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      provider: provider
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Agent listening on http://localhost:3000");
  console.log("📊 AI Stats: http://localhost:3000/ai/stats");
  console.log("🔍 AI Health: http://localhost:3000/ai/health");
  console.log("⚡ AI Compare: POST http://localhost:3000/ai/compare");
});
