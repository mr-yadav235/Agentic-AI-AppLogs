# Agentic-AI-AppLogs

An intelligent AI agent application with advanced logging and memory capabilities. This project combines AI-powered planning and execution with comprehensive application monitoring and log analysis.

## 🎥 Demo

Watch the application in action:

https://github.com/mr-yadav235/Agentic-AI-AppLogs/assets/user-attachments/assets/a8c655d0-12e7-4e0c-a666-010b45c84269

<details>
<summary>Alternative: Download and view locally</summary>

If the video doesn't load above, you can [download the demo video](./a8c655d0-12e7-4e0c-a666-010b45c84269.webm) and view it locally.

</details>

## Features

- 🤖 **AI Agent System**: Intelligent planning and task execution
- 🧠 **Memory Management**: Persistent memory for context retention  
- 📊 **Elasticsearch Integration**: Advanced log storage and search capabilities
- 🔥 **Multi-Model AI Support**: OpenAI GPT-4, Anthropic Claude, Google Gemini with intelligent routing
- 🎯 **Smart Model Selection**: Automatic model routing based on query complexity and performance
- 📈 **AI Performance Monitoring**: Real-time tracking of model performance and availability
- 🔄 **Automatic Fallback**: Seamless failover between AI providers for reliability
- 🛠️ **Custom Tools**: Specialized logging and monitoring tools
- 🌐 **Web Interface**: User-friendly web dashboard with multi-model testing

## Project Structure

```
├── agent/              # AI Agent core components
│   ├── agent.js        # Main agent logic
│   ├── executor.js     # Task execution engine
│   └── planner.js      # Planning and decision making
├── memory/             # Memory management system
│   └── memory.js       # Memory storage and retrieval
├── services/           # External service integrations
│   ├── elastic.js      # Elasticsearch service
│   └── openai.js       # OpenAI service integration
├── tools/              # Custom tools and utilities
│   └── logTool.js      # Logging tool implementation
├── public/             # Web interface assets
│   └── index.html      # Main web page
├── scripts/            # Utility scripts
├── server.js           # Web server
└── index.js           # Application entry point
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mr-yadav235/Agentic-AI-AppLogs.git
   cd Agentic-AI-AppLogs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create a `.env` file):
   ```env
   # Required
   OPENAI_API_KEY=your_openai_api_key
   ELASTICSEARCH_URL=your_elasticsearch_url
   
   # Optional - Multi-Model AI Support
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```
   
   > 📁 See `config/env.example` for complete configuration options

## Usage

1. Start the application:
   ```bash
   npm start
   ```

2. Access the web interface at `http://localhost:3000`

3. Use the AI agent for intelligent log analysis and task automation

## 🔥 Multi-Model AI Features

### Intelligent Model Routing
The system automatically selects the best AI model based on query complexity:
- **Simple queries** → Gemini Pro (fast & cost-effective)
- **Complex reasoning** → Claude 3 Sonnet (advanced reasoning)
- **Code generation** → GPT-4 (structured output)

### API Endpoints

#### Compare AI Models
Test the same prompt across multiple AI providers:
```bash
curl -X POST http://localhost:3000/ai/compare \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain machine learning in simple terms"}'
```

#### Check AI Health
Monitor the availability and performance of all AI providers:
```bash
curl http://localhost:3000/ai/health
```

#### Get Performance Stats  
View detailed performance metrics for each AI model:
```bash
curl http://localhost:3000/ai/stats
```

#### Query Specific Model
Force a query to use a specific AI provider:
```bash
# Use Claude
curl -X POST http://localhost:3000/ai/query/claude \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze this log pattern"}'

# Use Gemini  
curl -X POST http://localhost:3000/ai/query/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What does this error mean?"}'
```

### Fallback & Reliability
- Automatic failover if primary model is unavailable
- Performance tracking and optimization
- Cost-aware model selection
- Real-time health monitoring

## Technologies Used

### Core Technologies
- **Node.js**: Runtime environment
- **Express.js**: Web server framework
- **Elasticsearch**: Log storage and search
- **HTML/CSS/JavaScript**: Frontend interface

### AI/ML Technologies
- **OpenAI GPT-4**: Advanced reasoning and code generation
- **Anthropic Claude 3**: Complex analysis and reasoning
- **Google Gemini Pro**: Fast and cost-effective processing
- **Intelligent Model Routing**: Automatic AI provider selection

### Additional Libraries
- **@anthropic-ai/sdk**: Claude API integration
- **@google/generative-ai**: Gemini API integration
- **axios**: HTTP client for API requests
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please open an issue on GitHub.
