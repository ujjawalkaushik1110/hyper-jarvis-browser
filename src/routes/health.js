const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
  logger.info('Health check requested');
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hyper-jarvis-browser',
    version: '1.0.0'
  });
});

/**
 * Detailed status endpoint
 */
router.get('/status', (req, res) => {
  logger.info('Status check requested');
  
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
