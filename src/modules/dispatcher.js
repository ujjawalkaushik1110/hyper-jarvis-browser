const browserAutomation = require('./automation');
const logger = require('../config/logger');

/**
 * Action Dispatcher Module
 * Routes and executes actions on the browser
 */
class ActionDispatcher {
  constructor() {
    this.actionMap = {
      navigate: this.handleNavigate.bind(this),
      click: this.handleClick.bind(this),
      type: this.handleType.bind(this),
      wait: this.handleWait.bind(this),
      screenshot: this.handleScreenshot.bind(this),
      evaluate: this.handleEvaluate.bind(this),
      getContent: this.handleGetContent.bind(this)
    };
  }

  /**
   * Dispatch an action to the appropriate handler
   */
  async dispatch(action) {
    try {
      const actionType = action.type?.toLowerCase();
      
      if (!actionType) {
        throw new Error('Action type is required');
      }

      const handler = this.actionMap[actionType];
      
      if (!handler) {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      logger.info('Dispatching action', {
        type: actionType,
        description: action.description
      });

      const result = await handler(action.parameters || {});
      
      logger.info('Action completed successfully', {
        type: actionType
      });

      return {
        success: true,
        action: actionType,
        result
      };
    } catch (error) {
      logger.error('Action dispatch failed', {
        action: action.type,
        error: error.message
      });
      
      return {
        success: false,
        action: action.type,
        error: error.message
      };
    }
  }

  /**
   * Dispatch multiple actions in sequence
   */
  async dispatchBatch(actions) {
    const results = [];
    
    for (const action of actions) {
      const result = await this.dispatch(action);
      results.push(result);
      
      // Stop execution if an action fails
      if (!result.success) {
        logger.warn('Batch execution stopped due to failed action', {
          action: action.type
        });
        break;
      }
    }
    
    return results;
  }

  /**
   * Handle navigate action
   */
  async handleNavigate(params) {
    const { url } = params;
    if (!url) {
      throw new Error('URL is required for navigate action');
    }
    return await browserAutomation.navigate(url);
  }

  /**
   * Handle click action
   */
  async handleClick(params) {
    const { selector } = params;
    if (!selector) {
      throw new Error('Selector is required for click action');
    }
    return await browserAutomation.click(selector);
  }

  /**
   * Handle type action
   */
  async handleType(params) {
    const { selector, text } = params;
    if (!selector || text === undefined) {
      throw new Error('Selector and text are required for type action');
    }
    return await browserAutomation.type(selector, text);
  }

  /**
   * Handle wait action
   */
  async handleWait(params) {
    const { selector, timeout, state } = params;
    
    if (selector) {
      return await browserAutomation.waitForSelector(selector, { timeout, state });
    } else if (timeout) {
      // Simple timeout wait
      await new Promise(resolve => setTimeout(resolve, timeout));
      return { success: true, waited: timeout };
    } else {
      throw new Error('Either selector or timeout is required for wait action');
    }
  }

  /**
   * Handle screenshot action
   */
  async handleScreenshot(params) {
    const screenshot = await browserAutomation.screenshot(params);
    return {
      success: true,
      screenshot: screenshot.toString('base64')
    };
  }

  /**
   * Handle evaluate action
   */
  async handleEvaluate(params) {
    const { script } = params;
    if (!script) {
      throw new Error('Script is required for evaluate action');
    }
    return await browserAutomation.evaluate(script);
  }

  /**
   * Handle getContent action
   */
  async handleGetContent(params) {
    return await browserAutomation.getContent();
  }

  /**
   * Get list of supported actions
   */
  getSupportedActions() {
    return Object.keys(this.actionMap);
  }
}

// Export singleton instance
module.exports = new ActionDispatcher();
