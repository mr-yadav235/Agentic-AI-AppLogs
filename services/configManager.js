const fs = require('fs').promises;
const path = require('path');

/**
 * Configuration Manager
 * Handles loading, saving, and managing application configuration
 */

class ConfigManager {
  constructor() {
    this.configFile = path.join(__dirname, '../config/app-config.json');
    this.defaultConfig = {
      ai: {
        openai: { apiKey: process.env.OPENAI_API_KEY || '', status: 'unchecked' },
        claude: { apiKey: process.env.ANTHROPIC_API_KEY || '', status: 'unchecked' },
        gemini: { apiKey: process.env.GOOGLE_API_KEY || '', status: 'unchecked' }
      },
      elasticsearch: {
        url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        username: process.env.ELASTICSEARCH_USERNAME || '',
        password: process.env.ELASTICSEARCH_PASSWORD || '',
        caCert: process.env.ELASTICSEARCH_CA_CERT || '',
        status: 'unchecked'
      },
      system: {
        defaultRouting: process.env.DEFAULT_AI_PROVIDER || 'auto',
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 2,
        enableFallback: process.env.ENABLE_MODEL_FALLBACK !== 'false',
        logPerformance: process.env.LOG_AI_PERFORMANCE !== 'false'
      }
    };
    
    this.currentConfig = { ...this.defaultConfig };
  }

  /**
   * Initialize configuration manager
   */
  async initialize() {
    try {
      await this.ensureConfigDirectory();
      await this.loadConfiguration();
      console.log('✅ Configuration Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Configuration Manager:', error.message);
      console.log('📝 Using default configuration');
    }
  }

  /**
   * Ensure config directory exists
   */
  async ensureConfigDirectory() {
    const configDir = path.dirname(this.configFile);
    try {
      await fs.access(configDir);
    } catch (error) {
      await fs.mkdir(configDir, { recursive: true });
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfiguration() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      const savedConfig = JSON.parse(data);
      
      // Merge with defaults to ensure all properties exist
      this.currentConfig = this.mergeConfigs(this.defaultConfig, savedConfig);
      
      console.log('📄 Configuration loaded from file');
      return this.currentConfig;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📝 No configuration file found, using defaults');
        await this.saveConfiguration();
      } else {
        console.error('❌ Error loading configuration:', error.message);
      }
      return this.currentConfig;
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config = null) {
    try {
      const configToSave = config || this.currentConfig;
      configToSave.lastUpdated = new Date().toISOString();
      
      await fs.writeFile(this.configFile, JSON.stringify(configToSave, null, 2));
      
      if (config) {
        this.currentConfig = configToSave;
      }
      
      console.log('💾 Configuration saved to file');
      return true;
    } catch (error) {
      console.error('❌ Error saving configuration:', error.message);
      return false;
    }
  }

  /**
   * Merge configurations recursively
   */
  mergeConfigs(defaultConfig, savedConfig) {
    const merged = { ...defaultConfig };
    
    for (const key in savedConfig) {
      if (typeof savedConfig[key] === 'object' && savedConfig[key] !== null && !Array.isArray(savedConfig[key])) {
        merged[key] = this.mergeConfigs(merged[key] || {}, savedConfig[key]);
      } else {
        merged[key] = savedConfig[key];
      }
    }
    
    return merged;
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return { ...this.currentConfig };
  }

  /**
   * Update AI configuration
   */
  async updateAIConfiguration(aiConfig) {
    this.currentConfig.ai = {
      ...this.currentConfig.ai,
      ...aiConfig
    };
    
    return await this.saveConfiguration();
  }

  /**
   * Update Elasticsearch configuration
   */
  async updateElasticsearchConfiguration(esConfig) {
    this.currentConfig.elasticsearch = {
      ...this.currentConfig.elasticsearch,
      ...esConfig
    };
    
    return await this.saveConfiguration();
  }

  /**
   * Update system configuration
   */
  async updateSystemConfiguration(systemConfig) {
    this.currentConfig.system = {
      ...this.currentConfig.system,
      ...systemConfig
    };
    
    return await this.saveConfiguration();
  }

  /**
   * Get AI model configuration
   */
  getAIConfig(model = null) {
    if (model) {
      return this.currentConfig.ai[model];
    }
    return this.currentConfig.ai;
  }

  /**
   * Get Elasticsearch configuration
   */
  getElasticsearchConfig() {
    return this.currentConfig.elasticsearch;
  }

  /**
   * Get system configuration
   */
  getSystemConfig() {
    return this.currentConfig.system;
  }

  /**
   * Update model status
   */
  async updateModelStatus(model, status) {
    if (this.currentConfig.ai[model]) {
      this.currentConfig.ai[model].status = status;
      await this.saveConfiguration();
    }
  }

  /**
   * Update Elasticsearch status
   */
  async updateElasticsearchStatus(status) {
    this.currentConfig.elasticsearch.status = status;
    await this.saveConfiguration();
  }

  /**
   * Get environment variables for current configuration
   */
  getEnvironmentVariables() {
    const config = this.currentConfig;
    return {
      OPENAI_API_KEY: config.ai.openai.apiKey,
      ANTHROPIC_API_KEY: config.ai.claude.apiKey,
      GOOGLE_API_KEY: config.ai.gemini.apiKey,
      ELASTICSEARCH_URL: config.elasticsearch.url,
      ELASTICSEARCH_USERNAME: config.elasticsearch.username,
      ELASTICSEARCH_PASSWORD: config.elasticsearch.password,
      ELASTICSEARCH_CA_CERT: config.elasticsearch.caCert,
      DEFAULT_AI_PROVIDER: config.system.defaultRouting,
      HEALTH_CHECK_INTERVAL: config.system.healthCheckInterval.toString(),
      ENABLE_MODEL_FALLBACK: config.system.enableFallback.toString(),
      LOG_AI_PERFORMANCE: config.system.logPerformance.toString()
    };
  }

  /**
   * Apply configuration to environment
   */
  applyToEnvironment() {
    const envVars = this.getEnvironmentVariables();
    
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        process.env[key] = value;
      }
    }
    
    console.log('🔄 Configuration applied to environment');
  }

  /**
   * Reset to default configuration
   */
  async resetToDefaults() {
    this.currentConfig = { ...this.defaultConfig };
    return await this.saveConfiguration();
  }

  /**
   * Backup current configuration
   */
  async backupConfiguration() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(path.dirname(this.configFile), `app-config-backup-${timestamp}.json`);
    
    try {
      await fs.writeFile(backupFile, JSON.stringify(this.currentConfig, null, 2));
      console.log(`💾 Configuration backed up to: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ Error backing up configuration:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const configManager = new ConfigManager();

module.exports = { ConfigManager, configManager };