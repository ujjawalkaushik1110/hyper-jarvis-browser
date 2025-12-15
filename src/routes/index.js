const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health');
const browserRoutes = require('./browser');
const taskRoutes = require('./tasks');

// Mount routes
router.use('/health', healthRoutes);
router.use('/browser', browserRoutes);
router.use('/tasks', taskRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hyper-Jarvis Browser API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      browser: '/api/browser',
      tasks: '/api/tasks'
    }
  });
});

module.exports = router;
