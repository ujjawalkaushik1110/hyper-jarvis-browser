const express = require('express');
const router = express.Router();
const orchestrator = require('../modules/orchestrator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Execute a task with LLM-guided automation
 */
router.post('/execute', asyncHandler(async (req, res) => {
  const { task, options } = req.body;
  
  if (!task) {
    throw new AppError('Task description is required', 400);
  }

  logger.info('Task execution requested', { task });

  const result = await orchestrator.executeTask(task, options || {});
  
  res.json({
    success: result.success,
    result
  });
}));

/**
 * Execute custom action sequence
 */
router.post('/execute-actions', asyncHandler(async (req, res) => {
  const { actions, options } = req.body;
  
  if (!actions || !Array.isArray(actions)) {
    throw new AppError('Actions array is required', 400);
  }

  logger.info('Custom action sequence requested', {
    actionsCount: actions.length
  });

  const result = await orchestrator.executeActions(actions, options || {});
  
  res.json({
    success: result.success,
    result
  });
}));

/**
 * Execute adaptive task with multi-turn reasoning
 */
router.post('/execute-adaptive', asyncHandler(async (req, res) => {
  const { task, options } = req.body;
  
  if (!task) {
    throw new AppError('Task description is required', 400);
  }

  logger.info('Adaptive task execution requested', { task });

  const result = await orchestrator.executeAdaptiveTask(task, options || {});
  
  res.json({
    success: result.success,
    result
  });
}));

/**
 * Get current task status
 */
router.get('/current', (req, res) => {
  const currentTask = orchestrator.getCurrentTask();
  
  res.json({
    success: true,
    currentTask: currentTask || null
  });
});

/**
 * Get task history
 */
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const history = orchestrator.getTaskHistory(limit);
  
  res.json({
    success: true,
    history,
    count: history.length
  });
});

module.exports = router;
