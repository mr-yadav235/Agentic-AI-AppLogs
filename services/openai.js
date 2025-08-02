// Legacy OpenAI service - now using AI Manager for multi-model support
const { aiManager } = require('./aiManager');

/**
 * Legacy wrapper for backward compatibility
 * New code should use aiManager directly for multi-model support
 * @param {string} prompt - The prompt to send to the AI
 * @param {object} options - Optional parameters
 */
async function askLLM(prompt, options = {}) {
  // Route through AI manager with OpenAI preference for backward compatibility
  return await aiManager.askLLM(prompt, { 
    preferredProvider: 'openai',
    ...options 
  });
}

module.exports = { 
  askLLM,
  // Also export the AI manager for new functionality
  aiManager
};
