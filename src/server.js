require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const logger = require('./config/logger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const browserAutomation = require('./modules/automation');

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hyper-Jarvis Browser API Server',
    version: '1.0.0',
    status: 'running',
    documentation: '/api'
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  try {
    // Close browser if open
    await browserAutomation.close();
    logger.info('Browser closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown();
});

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: config.server.env,
    nodeVersion: process.version
  });
  
  logger.info('API Documentation available at http://localhost:' + PORT + '/api');
});

// Export for testing
module.exports = { app, server };
