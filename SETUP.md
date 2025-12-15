# Hyper-Jarvis Browser - Setup Guide

## Quick Start

### Local Development

1. **Install Dependencies**
```bash
npm install
```

2. **Install Playwright Browsers**
```bash
npx playwright install chromium
npx playwright install-deps chromium
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

Minimal `.env` for testing:
```bash
PORT=3000
NODE_ENV=development
HEADLESS=true
LOG_LEVEL=info
```

4. **Start the Server**
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Docker Deployment

1. **Build the Docker Image**
```bash
docker build -t hyper-jarvis-browser .
```

2. **Run the Container**
```bash
docker run -p 3000:3000 \
  -e HEADLESS=true \
  -e LOG_LEVEL=info \
  -e LLM_API_KEY=your_key_here \
  hyper-jarvis-browser
```

Or with environment file:
```bash
docker run -p 3000:3000 --env-file .env hyper-jarvis-browser
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `HEADLESS` | Run browser in headless mode | `true` | No |
| `BROWSER_TIMEOUT` | Browser operation timeout (ms) | `30000` | No |
| `LOG_LEVEL` | Logging level (info/debug/error) | `info` | No |
| `LLM_API_KEY` | LLM provider API key | - | No* |
| `LLM_PROVIDER` | LLM provider (openai/anthropic/deepseek) | `openai` | No |
| `LLM_MODEL` | LLM model name | `gpt-4` | No |
| `LLM_API_URL` | LLM API endpoint | `https://api.openai.com/v1` | No |

*Note: LLM_API_KEY is optional. Without it, the system uses mock reasoning for testing.

## Testing the API

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "hyper-jarvis-browser",
  "version": "1.0.0"
}
```

### Initialize Browser
```bash
curl -X POST http://localhost:3000/api/browser/initialize \
  -H "Content-Type: application/json"
```

### Navigate to URL
```bash
curl -X POST http://localhost:3000/api/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Execute a Task
```bash
curl -X POST http://localhost:3000/api/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Navigate to example.com and take a screenshot",
    "options": {
      "initializeBrowser": true
    }
  }'
```

### Execute Custom Actions
```bash
curl -X POST http://localhost:3000/api/tasks/execute-actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "type": "navigate",
        "parameters": {"url": "https://example.com"}
      },
      {
        "type": "screenshot",
        "parameters": {"fullPage": true}
      }
    ]
  }'
```

## Architecture Overview

### Directory Structure
```
src/
├── config/              # Configuration management
│   ├── config.js       # Environment config
│   └── logger.js       # Winston logger setup
├── middleware/         # Express middleware
│   └── errorHandler.js # Error handling
├── modules/            # Core modules
│   ├── automation.js   # Playwright automation
│   ├── llm-handler.js  # LLM integration
│   ├── dispatcher.js   # Action dispatcher
│   └── orchestrator.js # Task orchestrator
├── routes/             # API endpoints
│   ├── index.js       # Route aggregator
│   ├── health.js      # Health checks
│   ├── browser.js     # Browser control
│   └── tasks.js       # Task execution
└── server.js          # Main server file
```

### Module Dependencies

```
server.js
├── config/
│   ├── config.js
│   └── logger.js
├── middleware/
│   └── errorHandler.js
├── routes/
│   ├── health.js
│   ├── browser.js → automation.js, dispatcher.js
│   └── tasks.js → orchestrator.js
└── modules/
    ├── automation.js (Playwright)
    ├── llm-handler.js (LLM APIs)
    ├── dispatcher.js → automation.js
    └── orchestrator.js → llm-handler.js, dispatcher.js, automation.js
```

## LLM Integration

### Supported Providers

1. **OpenAI (GPT)**
   - Set `LLM_PROVIDER=openai`
   - Set `LLM_MODEL=gpt-4` or `gpt-3.5-turbo`
   - Set `LLM_API_KEY=your_openai_key`

2. **Anthropic (Claude)**
   - Set `LLM_PROVIDER=anthropic`
   - Set `LLM_MODEL=claude-3-opus` or `claude-3-sonnet`
   - Set `LLM_API_KEY=your_anthropic_key`

3. **DeepSeek**
   - Set `LLM_PROVIDER=deepseek`
   - Set `LLM_MODEL=deepseek-chat`
   - Set `LLM_API_KEY=your_deepseek_key`
   - Set `LLM_API_URL` to DeepSeek API endpoint

### Mock Mode

Without an API key, the system operates in mock mode:
- Uses predefined reasoning patterns
- Returns sample actions
- Useful for testing without LLM costs

## Browser Automation

### Supported Actions

- **navigate**: Go to a URL
- **click**: Click an element by selector
- **type**: Type text into an input field
- **wait**: Wait for selector or timeout
- **screenshot**: Take a page screenshot
- **evaluate**: Execute JavaScript in page context
- **getContent**: Get page HTML, title, and URL

### Headless vs Headed Mode

**Headless Mode (Recommended)**
- Set `HEADLESS=true`
- No display required
- Lower resource usage
- Suitable for production

**Headed Mode**
- Set `HEADLESS=false`
- Requires X11 display server
- Useful for debugging
- Not recommended for production

### Browser Lifecycle

1. **Initialize**: Browser starts on first API call
2. **Persistent**: Browser stays open across requests
3. **Close**: Explicitly close with `/api/browser/close`
4. **Cleanup**: Auto-cleanup on server shutdown

## Task Orchestration

### Execution Modes

1. **LLM-Guided** (`/api/tasks/execute`)
   - Task described in natural language
   - LLM generates action plan
   - Automated execution
   - Single-pass execution

2. **Custom Actions** (`/api/tasks/execute-actions`)
   - Predefined action sequence
   - Direct execution
   - No LLM reasoning
   - Precise control

3. **Adaptive** (`/api/tasks/execute-adaptive`)
   - Multi-turn reasoning
   - Iterative execution
   - Dynamic adjustment
   - Complex tasks

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {...}
}
```

### Common Errors

1. **Browser Not Initialized**
   - Call `/api/browser/initialize` first
   - Or set `initializeBrowser: true` in task options

2. **Selector Not Found**
   - Verify selector is correct
   - Use wait action before interacting
   - Check page loaded completely

3. **Network Errors**
   - Check internet connectivity
   - Verify URL is accessible
   - Increase timeout if needed

4. **LLM API Errors**
   - Verify API key is valid
   - Check API provider status
   - Monitor rate limits

## Logging

Logs are written to:
- **Console**: Formatted, colored output
- **logs/combined.log**: All log levels
- **logs/error.log**: Errors only

### Log Levels
- `error`: Error messages
- `warn`: Warnings
- `info`: General information
- `debug`: Detailed debugging

Set level with `LOG_LEVEL` environment variable.

## Performance Considerations

### Resource Usage
- Each browser instance uses ~100-200MB RAM
- Headless mode uses less resources
- Close browser when not needed

### Optimization Tips
1. Reuse browser instance across requests
2. Use headless mode in production
3. Set appropriate timeouts
4. Limit concurrent operations
5. Monitor memory usage

## Security

### Best Practices
1. **API Keys**: Never commit to version control
2. **Network**: Use firewall rules to restrict access
3. **Input Validation**: All inputs are validated
4. **Error Messages**: Sensitive info filtered in production
5. **CORS**: Configure appropriately for your use case

### Helmet.js Security Headers
- XSS Protection
- Content Security Policy
- HSTS
- No Sniff
- Frame Options

## Troubleshooting

### Server Won't Start
- Check port 3000 is available
- Verify Node.js version >= 18
- Check logs for detailed errors

### Browser Errors
- Install Playwright browsers: `npx playwright install`
- Install system dependencies: `npx playwright install-deps`
- Try headless mode: `HEADLESS=true`

### Network Errors in CI/CD
- SSL certificate issues are common in CI
- Use mock mode for testing
- Skip browser tests if needed

### Docker Build Fails
- Check network connectivity
- Verify base image is accessible
- Review Docker daemon logs

## Production Deployment

### Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure `HEADLESS=true`
- [ ] Set secure `LLM_API_KEY`
- [ ] Configure logging level
- [ ] Set up monitoring
- [ ] Configure firewall rules
- [ ] Enable HTTPS/TLS
- [ ] Set up log rotation
- [ ] Configure auto-restart
- [ ] Monitor resource usage

### Recommended Stack
- **Orchestration**: Docker Compose or Kubernetes
- **Reverse Proxy**: Nginx or Traefik
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or Loki
- **Process Manager**: PM2 (for bare metal)

## Support

For issues and questions:
- Check documentation: [API.md](./API.md)
- Review logs: `logs/combined.log`
- GitHub Issues: Project repository

## Next Steps

1. Read [API.md](./API.md) for detailed API documentation
2. Explore example requests in the documentation
3. Integrate with your application
4. Deploy to production environment
