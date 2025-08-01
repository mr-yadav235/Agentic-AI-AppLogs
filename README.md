# Agentic-AI-AppLogs

An intelligent AI agent application with advanced logging and memory capabilities. This project combines AI-powered planning and execution with comprehensive application monitoring and log analysis.

## Features

- 🤖 **AI Agent System**: Intelligent planning and task execution
- 🧠 **Memory Management**: Persistent memory for context retention
- 📊 **Elasticsearch Integration**: Advanced log storage and search capabilities
- 🔍 **OpenAI Integration**: Natural language processing and AI reasoning
- 🛠️ **Custom Tools**: Specialized logging and monitoring tools
- 🌐 **Web Interface**: User-friendly web dashboard

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
   OPENAI_API_KEY=your_openai_api_key
   ELASTICSEARCH_URL=your_elasticsearch_url
   ```

## Usage

1. Start the application:
   ```bash
   npm start
   ```

2. Access the web interface at `http://localhost:3000`

3. Use the AI agent for intelligent log analysis and task automation

## Technologies Used

- **Node.js**: Runtime environment
- **Express.js**: Web server framework
- **OpenAI API**: AI and natural language processing
- **Elasticsearch**: Log storage and search
- **HTML/CSS/JavaScript**: Frontend interface

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
