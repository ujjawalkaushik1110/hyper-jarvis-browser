const express = require('express');
const router = express.Router();
const browserAutomation = require('../modules/automation');
const dispatcher = require('../modules/dispatcher');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Initialize browser
 */
router.post('/initialize', asyncHandler(async (req, res) => {
  await browserAutomation.initialize();
  
  res.json({
    success: true,
    message: 'Browser initialized successfully'
  });
}));

/**
 * Navigate to URL
 */
router.post('/navigate', asyncHandler(async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    throw new AppError('URL is required', 400);
  }

  const result = await browserAutomation.navigate(url);
  
  res.json({
    success: true,
    result
  });
}));

/**
 * Click element
 */
router.post('/click', asyncHandler(async (req, res) => {
  const { selector } = req.body;
  
  if (!selector) {
    throw new AppError('Selector is required', 400);
  }

  const result = await browserAutomation.click(selector);
  
  res.json({
    success: true,
    result
  });
}));

/**
 * Type text
 */
router.post('/type', asyncHandler(async (req, res) => {
  const { selector, text } = req.body;
  
  if (!selector || text === undefined) {
    throw new AppError('Selector and text are required', 400);
  }

  const result = await browserAutomation.type(selector, text);
  
  res.json({
    success: true,
    result
  });
}));

/**
 * Take screenshot
 */
router.post('/screenshot', asyncHandler(async (req, res) => {
  const { fullPage, type } = req.body;
  
  const screenshot = await browserAutomation.screenshot({
    fullPage: fullPage || false,
    type: type || 'png'
  });
  
  res.json({
    success: true,
    screenshot: screenshot.toString('base64'),
    format: type || 'png'
  });
}));

/**
 * Get page content
 */
router.get('/content', asyncHandler(async (req, res) => {
  const content = await browserAutomation.getContent();
  
  res.json({
    success: true,
    content
  });
}));

/**
 * Execute JavaScript
 */
router.post('/evaluate', asyncHandler(async (req, res) => {
  const { script } = req.body;
  
  if (!script) {
    throw new AppError('Script is required', 400);
  }

  const result = await browserAutomation.evaluate(script);
  
  res.json({
    success: true,
    result
  });
}));

/**
 * Wait for selector
 */
router.post('/wait', asyncHandler(async (req, res) => {
  const { selector, timeout, state } = req.body;
  
  if (!selector) {
    throw new AppError('Selector is required', 400);
  }

  const result = await browserAutomation.waitForSelector(selector, {
    timeout,
    state
  });
  
  res.json({
    success: true,
    result
  });
}));

/**
 * Execute action via dispatcher
 */
router.post('/action', asyncHandler(async (req, res) => {
  const { type, parameters, description } = req.body;
  
  if (!type) {
    throw new AppError('Action type is required', 400);
  }

  const result = await dispatcher.dispatch({
    type,
    parameters,
    description
  });
  
  res.json({
    success: result.success,
    result
  });
}));

/**
 * Get supported actions
 */
router.get('/actions', (req, res) => {
  const actions = dispatcher.getSupportedActions();
  
  res.json({
    success: true,
    actions
  });
});

/**
 * Close browser
 */
router.post('/close', asyncHandler(async (req, res) => {
  await browserAutomation.close();
  
  res.json({
    success: true,
    message: 'Browser closed successfully'
  });
}));

module.exports = router;
