const express = require("express");
const cors = require("cors");
const { runAgent } = require("./agent/agent");
const { aiManager } = require("./services/aiManager");
const { configManager } = require("./services/configManager");

const app = express();

// Enhanced CORS configuration for separate frontend architecture
app.use(cors({
  origin: [
    'http://localhost:3001', // Frontend server
    'http://localhost:3002', // Chat UI (if running standalone)
    'http://localhost:3003', // Admin Console (if running standalone)
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002', 
    'http://127.0.0.1:3003'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// API-only server - no static file serving
// Frontend applications are served by separate frontend server

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

// Admin Configuration Endpoints
// =============================

// Health check endpoint for the API server
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Agentic AI Backend API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Get current configuration
app.get('/admin/config', (req, res) => {
  try {
    const config = configManager.getConfiguration();
    // Don't send sensitive data like API keys in plain text
    const safeConfig = {
      ...config,
      ai: {
        openai: { ...config.ai.openai, apiKey: config.ai.openai.apiKey ? '***CONFIGURED***' : '' },
        claude: { ...config.ai.claude, apiKey: config.ai.claude.apiKey ? '***CONFIGURED***' : '' },
        gemini: { ...config.ai.gemini, apiKey: config.ai.gemini.apiKey ? '***CONFIGURED***' : '' }
      },
      elasticsearch: {
        ...config.elasticsearch,
        password: config.elasticsearch.password ? '***CONFIGURED***' : ''
      }
    };
    res.json(safeConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save AI configuration
app.post('/admin/config/ai', async (req, res) => {
  try {
    const { openai, claude, gemini } = req.body;
    
    // Update configuration
    const success = await configManager.updateAIConfiguration({
      openai: openai || {},
      claude: claude || {},
      gemini: gemini || {}
    });
    
    if (success) {
      // Apply to environment and reinitialize AI manager
      configManager.applyToEnvironment();
      aiManager.initializeProviders();
      
      res.json({ success: true, message: 'AI configuration saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save AI configuration' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save Elasticsearch configuration
app.post('/admin/config/elasticsearch', async (req, res) => {
  try {
    const { url, username, password, caCert } = req.body;
    
    const success = await configManager.updateElasticsearchConfiguration({
      url,
      username,
      password,
      caCert
    });
    
    if (success) {
      // Apply to environment
      configManager.applyToEnvironment();
      
      res.json({ success: true, message: 'Elasticsearch configuration saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save Elasticsearch configuration' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save system configuration
app.post('/admin/config/system', async (req, res) => {
  try {
    const { defaultRouting, healthCheckInterval, enableFallback, logPerformance } = req.body;
    
    const success = await configManager.updateSystemConfiguration({
      defaultRouting,
      healthCheckInterval,
      enableFallback,
      logPerformance
    });
    
    if (success) {
      // Apply to environment
      configManager.applyToEnvironment();
      
      res.json({ success: true, message: 'System configuration saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save system configuration' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test individual AI model
app.post('/admin/test-ai/:model', async (req, res) => {
  const { model } = req.params;
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'API key is required' });
  }
  
  try {
    const startTime = Date.now();
    let result;
    
    // Create temporary AI manager instance for testing
    const testOptions = {
      enableFallback: false,
      maxTokens: 10
    };
    
    // Temporarily set the API key in environment
    const originalKey = process.env[getApiKeyEnvName(model)];
    process.env[getApiKeyEnvName(model)] = apiKey;
    
    try {
      // Test the specific model
      result = await aiManager.query('Test connection: respond with "OK"', {
        preferredProvider: model,
        ...testOptions
      });
      
      const responseTime = Date.now() - startTime;
      
      // Update model status
      await configManager.updateModelStatus(model, 'online');
      
      res.json({
        success: true,
        responseTime,
        model: result.model,
        response: result.content?.substring(0, 50) + '...'
      });
      
    } finally {
      // Restore original API key
      if (originalKey) {
        process.env[getApiKeyEnvName(model)] = originalKey;
      } else {
        delete process.env[getApiKeyEnvName(model)];
      }
    }
    
  } catch (error) {
    await configManager.updateModelStatus(model, 'offline');
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Test Elasticsearch connection
app.post('/admin/test-elasticsearch', async (req, res) => {
  const { url, username, password, caCert } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'Elasticsearch URL is required' });
  }
  
  try {
    const { Client } = require('@elastic/elasticsearch');
    
    // Build client configuration
    const clientConfig = { node: url };
    
    if (username && password) {
      clientConfig.auth = { username, password };
    }
    
    if (caCert) {
      clientConfig.tls = {
        ca: caCert,
        rejectUnauthorized: true
      };
    }
    
    const testClient = new Client(clientConfig);
    
    // Test connection
    const response = await testClient.cluster.health();
    
    await configManager.updateElasticsearchStatus('online');
    
    res.json({
      success: true,
      clusterName: response.body.cluster_name,
      status: response.body.status,
      nodes: response.body.number_of_nodes
    });
    
  } catch (error) {
    await configManager.updateElasticsearchStatus('offline');
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Restart system
app.post('/admin/restart', async (req, res) => {
  try {
    res.json({ success: true, message: 'System restart initiated' });
    
    console.log('🔄 System restart requested from admin panel');
    
    // Give time for response to be sent
    setTimeout(() => {
      console.log('🔄 Restarting system...');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get API key environment variable name
function getApiKeyEnvName(model) {
  const envNames = {
    'openai': 'OPENAI_API_KEY',
    'claude': 'ANTHROPIC_API_KEY',
    'gemini': 'GOOGLE_API_KEY'
  };
  return envNames[model];
}

// Initialize configuration manager and start server
async function startServer() {
  try {
    // Initialize configuration manager
    await configManager.initialize();
    
    // Apply configuration to environment
    configManager.applyToEnvironment();
    
    // Start API server
    app.listen(3000, () => {
      console.log('🔧 Backend API Server Configuration:');
      console.log('=========================================');
      console.log('🚀 API Server: http://localhost:3000');
      console.log('📡 Health Check: http://localhost:3000/api/health');
      console.log('');
      console.log('📊 Available Endpoints:');
      console.log('   POST /query - Main chat queries');
      console.log('   GET  /ai/health - AI models health check');
      console.log('   GET  /ai/stats - AI performance statistics');
      console.log('   POST /ai/compare - Compare AI models');
      console.log('   GET  /admin/config - Admin configuration');
      console.log('   POST /admin/config/* - Save configurations');
      console.log('   POST /admin/test-* - Test connections');
      console.log('   POST /admin/restart - Restart system');
      console.log('');
      console.log('🎨 Frontend Applications:');
      console.log('   💬 Chat Interface: http://localhost:3001');
      console.log('   ⚙️  Admin Console: http://localhost:3001/admin');
      console.log('   📖 Start Frontend: cd frontend && npm install && npm start');
      console.log('');
      console.log('✅ API Server Ready - Accepting requests from frontend applications');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
