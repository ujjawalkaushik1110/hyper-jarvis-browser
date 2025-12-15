const { chromium } = require('playwright');
const logger = require('../config/logger');
const config = require('../config/config');

/**
 * Browser Automation Module using Playwright
 * Handles all browser-related operations
 */
class BrowserAutomation {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize browser instance
   */
  async initialize() {
    try {
      if (!this.browser) {
        logger.info('Initializing browser...');
        this.browser = await chromium.launch({
          headless: config.browser.headless,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.context = await this.browser.newContext({
          viewport: { width: 1280, height: 720 },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        
        this.page = await this.context.newPage();
        logger.info('Browser initialized successfully');
      }
      return this.page;
    } catch (error) {
      logger.error('Failed to initialize browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url) {
    try {
      await this.ensureInitialized();
      logger.info(`Navigating to ${url}`);
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: config.browser.timeout 
      });
      return { success: true, url };
    } catch (error) {
      logger.error('Navigation failed', { url, error: error.message });
      throw error;
    }
  }

  /**
   * Click on an element
   */
  async click(selector) {
    try {
      await this.ensureInitialized();
      logger.info(`Clicking element: ${selector}`);
      await this.page.click(selector, { timeout: config.browser.timeout });
      return { success: true, selector };
    } catch (error) {
      logger.error('Click failed', { selector, error: error.message });
      throw error;
    }
  }

  /**
   * Type text into an input
   */
  async type(selector, text) {
    try {
      await this.ensureInitialized();
      logger.info(`Typing into element: ${selector}`);
      await this.page.fill(selector, text, { timeout: config.browser.timeout });
      return { success: true, selector, text };
    } catch (error) {
      logger.error('Type failed', { selector, error: error.message });
      throw error;
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(options = {}) {
    try {
      await this.ensureInitialized();
      logger.info('Taking screenshot');
      const screenshot = await this.page.screenshot({
        fullPage: options.fullPage || false,
        type: options.type || 'png'
      });
      return screenshot;
    } catch (error) {
      logger.error('Screenshot failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get page content
   */
  async getContent() {
    try {
      await this.ensureInitialized();
      const content = await this.page.content();
      const title = await this.page.title();
      const url = this.page.url();
      return { content, title, url };
    } catch (error) {
      logger.error('Get content failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute JavaScript in the page context
   */
  async evaluate(script) {
    try {
      await this.ensureInitialized();
      logger.info('Evaluating script');
      const result = await this.page.evaluate(script);
      return { success: true, result };
    } catch (error) {
      logger.error('Evaluate failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Wait for selector
   */
  async waitForSelector(selector, options = {}) {
    try {
      await this.ensureInitialized();
      logger.info(`Waiting for selector: ${selector}`);
      await this.page.waitForSelector(selector, {
        timeout: options.timeout || config.browser.timeout,
        state: options.state || 'visible'
      });
      return { success: true, selector };
    } catch (error) {
      logger.error('Wait for selector failed', { selector, error: error.message });
      throw error;
    }
  }

  /**
   * Close browser
   */
  async close() {
    try {
      if (this.browser) {
        logger.info('Closing browser');
        await this.browser.close();
        this.browser = null;
        this.context = null;
        this.page = null;
        logger.info('Browser closed successfully');
      }
    } catch (error) {
      logger.error('Failed to close browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Ensure browser is initialized
   */
  async ensureInitialized() {
    if (!this.page) {
      await this.initialize();
    }
  }
}

// Export singleton instance
module.exports = new BrowserAutomation();
