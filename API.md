# Hyper-Jarvis Browser API Documentation

## Overview

Hyper-Jarvis is an AI-native browser automation service with agentic reasoning. It provides REST API endpoints for controlling browser automation, executing complex multi-step tasks, and integrating with LLM reasoning engines (GPT/Claude/DeepSeek).

## Base URL

```
http://localhost:3000/api
```

## Architecture

### Modular Components

1. **Browser Automation Module** (`src/modules/automation.js`)
   - Playwright integration for browser control
   - Headless browser operations
   - Element interaction and page manipulation

2. **LLM Handler** (`src/modules/llm-handler.js`)
   - Integration with OpenAI, Anthropic (Claude), and DeepSeek
   - Reasoning layer for task interpretation
   - Action plan generation

3. **Action Dispatcher** (`src/modules/dispatcher.js`)
   - Routes actions to appropriate handlers
   - Batch action execution
   - Error handling for individual actions

4. **Task Orchestrator** (`src/modules/orchestrator.js`)
   - Coordinates complex multi-step tasks
   - LLM-guided automation
   - Adaptive task execution with multi-turn reasoning

## API Endpoints

### Health Check

#### `GET /api/health`
Check if the service is running.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "hyper-jarvis-browser",
  "version": "1.0.0"
}
```

#### `GET /api/health/status`
Get detailed service status.

**Response:**
```json
{
  "success": true,
  "status": "operational",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {...},
  "environment": "development"
}
```

### Browser Control

#### `POST /api/browser/initialize`
Initialize the browser instance.

**Response:**
```json
{
  "success": true,
  "message": "Browser initialized successfully"
}
```

#### `POST /api/browser/navigate`
Navigate to a URL.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "url": "https://example.com"
  }
}
```

#### `POST /api/browser/click`
Click on an element.

**Request Body:**
```json
{
  "selector": "button#submit"
}
```

#### `POST /api/browser/type`
Type text into an input field.

**Request Body:**
```json
{
  "selector": "input[name='username']",
  "text": "myusername"
}
```

#### `POST /api/browser/screenshot`
Take a screenshot of the current page.

**Request Body:**
```json
{
  "fullPage": true,
  "type": "png"
}
```

**Response:**
```json
{
  "success": true,
  "screenshot": "base64_encoded_image...",
  "format": "png"
}
```

#### `GET /api/browser/content`
Get the current page content.

**Response:**
```json
{
  "success": true,
  "content": {
    "content": "<!DOCTYPE html>...",
    "title": "Page Title",
    "url": "https://example.com"
  }
}
```

#### `POST /api/browser/evaluate`
Execute JavaScript in the page context.

**Request Body:**
```json
{
  "script": "document.title"
}
```

#### `POST /api/browser/wait`
Wait for a selector to appear.

**Request Body:**
```json
{
  "selector": "div.content",
  "timeout": 5000,
  "state": "visible"
}
```

#### `POST /api/browser/action`
Execute a generic action via the dispatcher.

**Request Body:**
```json
{
  "type": "navigate",
  "parameters": {
    "url": "https://example.com"
  },
  "description": "Navigate to example.com"
}
```

#### `GET /api/browser/actions`
Get list of supported action types.

**Response:**
```json
{
  "success": true,
  "actions": ["navigate", "click", "type", "wait", "screenshot", "evaluate", "getContent"]
}
```

#### `POST /api/browser/close`
Close the browser instance.

**Response:**
```json
{
  "success": true,
  "message": "Browser closed successfully"
}
```

### Task Execution

#### `POST /api/tasks/execute`
Execute a task with LLM-guided automation.

**Request Body:**
```json
{
  "task": "Go to Google and search for 'AI automation'",
  "options": {
    "url": "https://google.com",
    "initializeBrowser": true,
    "stopOnError": true,
    "stepDelay": 1000
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "taskId": "task_1234567890_abc123",
    "description": "Go to Google and search for 'AI automation'",
    "status": "completed",
    "success": true,
    "duration": 5420,
    "totalSteps": 3,
    "successfulSteps": 3,
    "failedSteps": 0,
    "steps": [...],
    "reasoning": {...}
  }
}
```

#### `POST /api/tasks/execute-actions`
Execute a custom sequence of actions without LLM reasoning.

**Request Body:**
```json
{
  "actions": [
    {
      "type": "navigate",
      "parameters": { "url": "https://example.com" }
    },
    {
      "type": "click",
      "parameters": { "selector": "button#submit" }
    }
  ],
  "options": {
    "initializeBrowser": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "results": [...],
    "totalActions": 2,
    "successfulActions": 2
  }
}
```

#### `POST /api/tasks/execute-adaptive`
Execute a task with adaptive multi-turn reasoning.

**Request Body:**
```json
{
  "task": "Find the product price on this e-commerce page",
  "options": {
    "maxIterations": 3,
    "iterationDelay": 2000
  }
}
```

#### `GET /api/tasks/current`
Get the currently executing task.

**Response:**
```json
{
  "success": true,
  "currentTask": {
    "id": "task_1234567890_abc123",
    "description": "Task description",
    "startTime": 1234567890000,
    "status": "running",
    "steps": [...]
  }
}
```

#### `GET /api/tasks/history?limit=10`
Get task execution history.

**Response:**
```json
{
  "success": true,
  "history": [...],
  "count": 10
}
```

## Action Types

The dispatcher supports the following action types:

- **navigate**: Navigate to a URL
- **click**: Click an element
- **type**: Type text into an input
- **wait**: Wait for a selector or timeout
- **screenshot**: Take a screenshot
- **evaluate**: Execute JavaScript
- **getContent**: Get page content

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {...}
}
```

HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found
- `500`: Internal Server Error

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# LLM Configuration
LLM_API_KEY=your_api_key_here
LLM_PROVIDER=openai
LLM_MODEL=gpt-4
LLM_API_URL=https://api.openai.com/v1

# Browser Configuration
HEADLESS=true
BROWSER_TIMEOUT=30000

# Logging
LOG_LEVEL=info
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

## Logging

The service uses Winston for logging. Logs are written to:
- Console (formatted, colored)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

## Development

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

## Example Usage

### Simple Navigation

```javascript
// Initialize browser
await fetch('http://localhost:3000/api/browser/initialize', {
  method: 'POST'
});

// Navigate to website
await fetch('http://localhost:3000/api/browser/navigate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});

// Take screenshot
const response = await fetch('http://localhost:3000/api/browser/screenshot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullPage: true })
});

const data = await response.json();
console.log('Screenshot:', data.screenshot);
```

### Task Execution with LLM

```javascript
const response = await fetch('http://localhost:3000/api/tasks/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: 'Search for "AI automation" on Google and get the first result title',
    options: {
      url: 'https://google.com',
      stepDelay: 1000
    }
  })
});

const result = await response.json();
console.log('Task Result:', result);
```
