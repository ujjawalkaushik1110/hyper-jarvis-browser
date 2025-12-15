const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config/config');

/**
 * LLM Handler Module
 * Manages interactions with Language Learning Models for reasoning
 */
class LLMHandler {
  constructor() {
    this.apiKey = config.llm.apiKey;
    this.provider = config.llm.provider;
    this.model = config.llm.model;
    this.apiUrl = config.llm.apiUrl;
  }

  /**
   * Send a reasoning request to the LLM
   */
  async reason(prompt, context = {}) {
    try {
      logger.info('Sending reasoning request to LLM', {
        provider: this.provider,
        model: this.model
      });

      if (!this.apiKey) {
        logger.warn('LLM API key not configured, using mock response');
        return this.mockReasoning(prompt, context);
      }

      const response = await this.callLLM(prompt, context);
      logger.info('LLM reasoning completed successfully');
      return response;
    } catch (error) {
      logger.error('LLM reasoning failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Call the LLM API based on provider
   */
  async callLLM(prompt, context) {
    switch (this.provider.toLowerCase()) {
      case 'openai':
        return await this.callOpenAI(prompt, context);
      case 'anthropic':
        return await this.callAnthropic(prompt, context);
      case 'deepseek':
        return await this.callDeepSeek(prompt, context);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt, context) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant helping with browser automation tasks. Analyze the task and provide structured action steps.'
            },
            {
              role: 'user',
              content: `Context: ${JSON.stringify(context)}\n\nTask: ${prompt}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseResponse(content);
    } catch (error) {
      logger.error('OpenAI API call failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Call Anthropic (Claude) API
   */
  async callAnthropic(prompt, context) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Context: ${JSON.stringify(context)}\n\nTask: ${prompt}\n\nProvide structured action steps for browser automation.`
            }
          ]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.content[0].text;
      return this.parseResponse(content);
    } catch (error) {
      logger.error('Anthropic API call failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Call DeepSeek API
   */
  async callDeepSeek(prompt, context) {
    try {
      // DeepSeek uses OpenAI-compatible API format
      // The apiUrl should be configured to point to DeepSeek endpoint
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant helping with browser automation tasks. Analyze the task and provide structured action steps.'
            },
            {
              role: 'user',
              content: `Context: ${JSON.stringify(context)}\n\nTask: ${prompt}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseResponse(content);
    } catch (error) {
      logger.error('DeepSeek API call failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Parse LLM response into structured actions
   */
  parseResponse(content) {
    try {
      // Try to extract JSON if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse as JSON directly
      try {
        return JSON.parse(content);
      } catch {
        // Return as structured text response
        return {
          reasoning: content,
          actions: this.extractActions(content)
        };
      }
    } catch (error) {
      logger.error('Failed to parse LLM response', { error: error.message });
      return {
        reasoning: content,
        actions: []
      };
    }
  }

  /**
   * Extract actions from text response
   */
  extractActions(text) {
    const actions = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      // Look for action patterns like "1. Navigate to...", "- Click on...", etc.
      const actionPattern = /^\d+\.\s*|^-\s*|^\*\s*/;
      if (actionPattern.test(line)) {
        const action = line.replace(actionPattern, '').trim();
        if (action) {
          actions.push({ description: action });
        }
      }
    });

    return actions;
  }

  /**
   * Mock reasoning for testing without LLM API
   */
  mockReasoning(prompt, context) {
    logger.info('Using mock LLM reasoning');
    
    return {
      reasoning: `Mock reasoning for task: ${prompt}`,
      actions: [
        {
          type: 'navigate',
          description: 'Navigate to the target URL',
          parameters: { url: context.url || 'https://example.com' }
        },
        {
          type: 'wait',
          description: 'Wait for page to load',
          parameters: { selector: 'body' }
        }
      ],
      confidence: 0.8
    };
  }

  /**
   * Analyze page content and provide insights
   */
  async analyzePage(pageContent, task) {
    const prompt = `Analyze this webpage and suggest actions to complete the task: ${task}`;
    const context = {
      pageContent: pageContent.substring(0, 2000), // Limit content length
      title: pageContent.title,
      url: pageContent.url
    };
    
    return await this.reason(prompt, context);
  }
}

// Export singleton instance
module.exports = new LLMHandler();
