# Hyper-Jarvis Browser

**AI-native browser automation with agentic reasoning**

Hyper-Jarvis is a powerful browser automation service that combines Playwright for browser control with LLM reasoning engines (GPT/Claude/DeepSeek) to execute complex multi-step tasks intelligently.

## Features

- 🤖 **LLM-Guided Automation**: Integrates with OpenAI, Anthropic Claude, and DeepSeek for intelligent task reasoning
- 🌐 **Browser Automation**: Full Playwright integration for headless browser control
- 🎯 **Action Dispatcher**: Flexible action routing system for browser operations
- 🎼 **Task Orchestrator**: Coordinates complex multi-step tasks with adaptive execution
- 📝 **Comprehensive Logging**: Winston-based logging with multiple transports
- 🔒 **Error Handling**: Robust error handling and recovery mechanisms
- 🐳 **Docker Ready**: Fully containerized for easy deployment
- 🚀 **REST API**: Clean, well-documented API endpoints

## Architecture

### Core Modules

1. **Automation Module** (`src/modules/automation.js`)
   - Playwright browser control
   - Page navigation, interaction, and content extraction
   - Screenshot capabilities

2. **LLM Handler** (`src/modules/llm-handler.js`)
   - Multi-provider LLM integration (OpenAI, Anthropic, DeepSeek)
   - Task reasoning and action plan generation
   - Mock mode for testing without API keys

3. **Action Dispatcher** (`src/modules/dispatcher.js`)
   - Action type routing
   - Batch action execution
   - Individual action error handling

4. **Task Orchestrator** (`src/modules/orchestrator.js`)
   - Task lifecycle management
   - LLM-guided task execution
   - Adaptive multi-turn reasoning
   - Task history tracking

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ujjawalkaushik1110/hyper-jarvis-browser.git
cd hyper-jarvis-browser
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

### Development Mode

Run with auto-reload:
```bash
npm run dev
```

## Docker Deployment

Build the Docker image:
```bash
docker build -t hyper-jarvis-browser .
```

Run the container:
```bash
docker run -p 3000:3000 --env-file .env hyper-jarvis-browser
```

## API Documentation

See [API.md](./API.md) for complete API documentation.

### Quick Examples

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Navigate to a URL:**
```bash
curl -X POST http://localhost:3000/api/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Execute a Task with LLM:**
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Go to Google and search for AI automation",
    "options": {
      "url": "https://google.com"
    }
  }'
```

## Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

Key configurations:
- `PORT`: Server port (default: 3000)
- `LLM_API_KEY`: Your LLM provider API key
- `LLM_PROVIDER`: LLM provider (openai, anthropic, deepseek)
- `LLM_MODEL`: Model to use (gpt-4, claude-3, etc.)
- `HEADLESS`: Run browser in headless mode (true/false)
- `LOG_LEVEL`: Logging level (info, debug, error)

## Project Structure

```
hyper-jarvis-browser/
├── src/
│   ├── config/          # Configuration and logger
│   │   ├── config.js
│   │   └── logger.js
│   ├── middleware/      # Express middleware
│   │   └── errorHandler.js
│   ├── modules/         # Core modules
│   │   ├── automation.js    # Browser automation
│   │   ├── llm-handler.js   # LLM integration
│   │   ├── dispatcher.js    # Action dispatcher
│   │   └── orchestrator.js  # Task orchestrator
│   ├── routes/          # API routes
│   │   ├── index.js
│   │   ├── health.js
│   │   ├── browser.js
│   │   └── tasks.js
│   └── server.js        # Main server file
├── logs/                # Log files
├── .env.example         # Environment variables template
├── .dockerignore
├── Dockerfile
├── package.json
├── API.md              # API documentation
└── README.md
```

## Logging

Logs are written to:
- Console (formatted with colors)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

## Error Handling

The application includes comprehensive error handling:
- Global error handler middleware
- Async error wrapper for route handlers
- Graceful shutdown on SIGTERM/SIGINT
- Uncaught exception and unhandled rejection handlers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
