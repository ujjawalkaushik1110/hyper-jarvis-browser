const llmHandler = require('./llm-handler');
const dispatcher = require('./dispatcher');
const browserAutomation = require('./automation');
const logger = require('../config/logger');

/**
 * Task Orchestrator Module
 * Coordinates complex multi-step tasks using LLM reasoning and action dispatch
 */
class TaskOrchestrator {
  constructor() {
    this.currentTask = null;
    this.taskHistory = [];
  }

  /**
   * Execute a task with LLM-guided automation
   */
  async executeTask(taskDescription, options = {}) {
    try {
      logger.info('Starting task execution', {
        task: taskDescription,
        options
      });

      const taskId = this.generateTaskId();
      this.currentTask = {
        id: taskId,
        description: taskDescription,
        startTime: Date.now(),
        status: 'running',
        steps: []
      };

      // Step 1: Initialize browser if needed
      if (options.initializeBrowser !== false) {
        await browserAutomation.initialize();
      }

      // Step 2: Get initial context
      let context = {
        url: options.url || null,
        initialState: options.initialState || {}
      };

      // Step 3: Get LLM reasoning and action plan
      logger.info('Requesting LLM reasoning for task');
      const reasoning = await llmHandler.reason(taskDescription, context);
      
      this.currentTask.reasoning = reasoning;
      logger.info('LLM reasoning received', {
        actionsCount: reasoning.actions?.length || 0
      });

      // Step 4: Execute actions from LLM plan
      const results = [];
      
      if (reasoning.actions && reasoning.actions.length > 0) {
        logger.info('Executing action plan', {
          totalActions: reasoning.actions.length
        });

        for (let i = 0; i < reasoning.actions.length; i++) {
          const action = reasoning.actions[i];
          
          logger.info(`Executing action ${i + 1}/${reasoning.actions.length}`, {
            type: action.type,
            description: action.description
          });

          const stepResult = {
            stepNumber: i + 1,
            action: action,
            startTime: Date.now()
          };

          try {
            // Dispatch the action
            const actionResult = await dispatcher.dispatch(action);
            
            stepResult.result = actionResult;
            stepResult.success = actionResult.success;
            stepResult.duration = Date.now() - stepResult.startTime;

            results.push(stepResult);
            this.currentTask.steps.push(stepResult);

            // If action failed, decide whether to continue
            if (!actionResult.success) {
              if (options.stopOnError !== false) {
                logger.warn('Action failed, stopping task execution', {
                  action: action.type,
                  error: actionResult.error
                });
                break;
              }
            }

            // Add delay between actions if specified
            if (options.stepDelay) {
              await this.delay(options.stepDelay);
            }
          } catch (error) {
            stepResult.success = false;
            stepResult.error = error.message;
            stepResult.duration = Date.now() - stepResult.startTime;
            
            results.push(stepResult);
            this.currentTask.steps.push(stepResult);

            if (options.stopOnError !== false) {
              logger.error('Action execution failed, stopping task', {
                error: error.message
              });
              break;
            }
          }
        }
      }

      // Step 5: Finalize task
      const taskResult = await this.finalizeTask(results);
      
      logger.info('Task execution completed', {
        taskId,
        duration: taskResult.duration,
        success: taskResult.success
      });

      return taskResult;
    } catch (error) {
      logger.error('Task execution failed', {
        task: taskDescription,
        error: error.message
      });
      
      if (this.currentTask) {
        this.currentTask.status = 'failed';
        this.currentTask.error = error.message;
        this.currentTask.duration = Date.now() - this.currentTask.startTime;
      }

      throw error;
    }
  }

  /**
   * Execute a custom action sequence without LLM reasoning
   */
  async executeActions(actions, options = {}) {
    try {
      logger.info('Executing custom action sequence', {
        actionsCount: actions.length
      });

      if (options.initializeBrowser !== false) {
        await browserAutomation.initialize();
      }

      const results = await dispatcher.dispatchBatch(actions);
      
      return {
        success: results.every(r => r.success),
        results,
        totalActions: actions.length,
        successfulActions: results.filter(r => r.success).length
      };
    } catch (error) {
      logger.error('Action sequence execution failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a task with adaptive reasoning (multi-turn)
   */
  async executeAdaptiveTask(taskDescription, options = {}) {
    try {
      logger.info('Starting adaptive task execution', {
        task: taskDescription
      });

      const maxIterations = options.maxIterations || 3;
      let iteration = 0;
      let taskCompleted = false;
      const allResults = [];

      await browserAutomation.initialize();

      while (!taskCompleted && iteration < maxIterations) {
        iteration++;
        logger.info(`Adaptive task iteration ${iteration}/${maxIterations}`);

        // Get current page state
        const pageContent = await browserAutomation.getContent();
        
        // Get LLM analysis and next steps
        const reasoning = await llmHandler.analyzePage(
          pageContent,
          taskDescription
        );

        // Execute suggested actions
        if (reasoning.actions && reasoning.actions.length > 0) {
          const results = await dispatcher.dispatchBatch(reasoning.actions);
          allResults.push(...results);

          // Check if task is complete (this is simplified)
          const allSuccessful = results.every(r => r.success);
          if (allSuccessful && iteration >= maxIterations - 1) {
            taskCompleted = true;
          }
        } else {
          logger.info('No more actions suggested, task may be complete');
          taskCompleted = true;
        }

        // Add delay between iterations
        if (!taskCompleted && options.iterationDelay) {
          await this.delay(options.iterationDelay);
        }
      }

      return {
        success: true,
        iterations: iteration,
        results: allResults,
        taskCompleted
      };
    } catch (error) {
      logger.error('Adaptive task execution failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Finalize task and compile results
   */
  async finalizeTask(results) {
    if (!this.currentTask) {
      throw new Error('No active task to finalize');
    }

    const duration = Date.now() - this.currentTask.startTime;
    const successfulSteps = results.filter(r => r.success).length;
    
    const taskResult = {
      taskId: this.currentTask.id,
      description: this.currentTask.description,
      status: successfulSteps === results.length ? 'completed' : 'partial',
      success: successfulSteps === results.length,
      duration,
      totalSteps: results.length,
      successfulSteps,
      failedSteps: results.length - successfulSteps,
      steps: results,
      reasoning: this.currentTask.reasoning
    };

    // Add to history
    this.taskHistory.push({
      ...taskResult,
      completedAt: Date.now()
    });

    // Keep history limited to last 100 tasks
    if (this.taskHistory.length > 100) {
      this.taskHistory.shift();
    }

    this.currentTask = null;
    return taskResult;
  }

  /**
   * Get current task status
   */
  getCurrentTask() {
    return this.currentTask;
  }

  /**
   * Get task history
   */
  getTaskHistory(limit = 10) {
    return this.taskHistory.slice(-limit);
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
module.exports = new TaskOrchestrator();
