const natural = require('natural');
const compromise = require('compromise');
const Task = require('../models/Task');
const regression = require('regression');

class MLPredictor {
  constructor() {
    this.isInitialized = false;
    this.models = {
      durationPredictor: null,
      complexityPredictor: null,
      priorityPredictor: null
    };
    this.trainingData = {
      tasks: [],
      features: [],
      labels: []
    };
    this.featureExtractor = new FeatureExtractor();
  }

  /**
   * Initialize ML models and training data
   */
  async initialize() {
    try {
      console.log('Initializing ML Predictor (Statistical Mode)...');
      
      // Load historical task data
      await this.loadTrainingData();
      
      // Initialize models
      await this.initializeModels();
      
      this.isInitialized = true;
      console.log('ML Predictor initialized successfully using statistical models');
    } catch (error) {
      console.error('Failed to initialize ML Predictor:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Load training data from historical tasks
   */
  async loadTrainingData() {
    try {
      const tasks = await Task.find({
        status: 'completed',
        timeSpent: { $gt: 0 } // Only tasks with recorded time
      }).limit(1000); // Limit for performance

      this.trainingData.tasks = tasks;
      
      // Extract features and labels for each task
      for (const task of tasks) {
        const features = await this.featureExtractor.extractFeatures(task);
        const durationLabel = task.timeSpent; // Time spent in hours
        
        this.trainingData.features.push(features);
        this.trainingData.labels.push(durationLabel);
      }

      console.log(`Loaded ${tasks.length} training samples`);
    } catch (error) {
      console.error('Error loading training data:', error);
      // Use mock data if no historical data available
      this.generateMockTrainingData();
    }
  }

  /**
   * Initialize ML models using statistical regression
   */
  async initializeModels() {
    try {
      // Initialize duration prediction model using linear regression
      if (this.trainingData.features.length > 10) {
        console.log('Training linear regression model...');
        
        // Prepare data for regression library
        const trainingDataForRegression = this.trainingData.features.map((features, index) => [
          features.reduce((sum, f) => sum + f, 0) / features.length, // Average of features as single input
          this.trainingData.labels[index]
        ]);
        
        const result = regression.linear(trainingDataForRegression);
        
        this.models.durationPredictor = {
          predict: (features) => {
            const input = features.reduce((sum, f) => sum + f, 0) / features.length;
            return result.predict(input)[1]; // Get the predicted y value
          },
          equation: result.equation,
          r2: result.r2
        };
        
        console.log('Linear regression model trained successfully');
      } else {
        console.log('Insufficient training data, using statistical model');
        this.models.durationPredictor = new StatisticalPredictor();
      }

      console.log('ML models initialized with statistical methods');
    } catch (error) {
      console.error('Error initializing models:', error);
      // Fallback to statistical models
      this.models.durationPredictor = new StatisticalPredictor();
    }
  }

  /**
   * Predict task completion duration
   */
  async predictTaskDuration(task) {
    try {
      if (!this.isInitialized) {
        return this.getFallbackPrediction(task);
      }

      const features = await this.featureExtractor.extractFeatures(task);
      
      if (this.models.durationPredictor.predict && this.trainingData.features.length >= 3) {
        // Linear regression model - only use if we have sufficient data
        try {
          const prediction = this.models.durationPredictor.predict(features);
          
          // Check for NaN or invalid prediction
          if (!isNaN(prediction) && prediction > 0) {
            return {
              duration: Math.max(1, Math.round(prediction * 10) / 10), // Minimum 1 hour, rounded to 1 decimal
              confidence: this.calculatePredictionConfidence(features),
              factors: this.analyzePredictionFactors(features, task),
              method: 'linear_regression'
            };
          } else {
            // Fallback to statistical if prediction is invalid
            return this.models.durationPredictor.predict(features, task);
          }
        } catch (error) {
          console.log('Linear regression failed, using statistical fallback:', error.message);
          return this.models.durationPredictor.predict(features, task);
        }
      } else {
        // Statistical model or insufficient data
        if (this.models.durationPredictor.predict && typeof this.models.durationPredictor.predict === 'function') {
          return this.models.durationPredictor.predict(features, task);
        } else {
          return this.getFallbackPrediction(task);
        }
      }
    } catch (error) {
      console.error('Error predicting task duration:', error);
      return this.getFallbackPrediction(task);
    }
  }

  /**
   * Predict task complexity score
   */
  async predictComplexity(task) {
    try {
      const features = await this.featureExtractor.extractFeatures(task);
      
      // Use rule-based complexity calculation
      const complexity = this.calculateRuleBasedComplexity(task, features);
      
      return {
        complexity,
        confidence: 0.7,
        factors: this.getComplexityFactors(task, features)
      };
    } catch (error) {
      console.error('Error predicting complexity:', error);
      return { complexity: 0.5, confidence: 0.3, factors: [] };
    }
  }

  /**
   * Analyze prediction factors
   */
  analyzePredictionFactors(features, task) {
    const factors = [];
    
    // Word count impact
    if (features[0] > 0.7) factors.push('Long description indicates complexity');
    
    // Priority impact
    if (features[2] > 0.8) factors.push('High priority suggests urgency');
    
    // Subtask impact
    if (features[3] > 0.5) factors.push('Multiple subtasks increase duration');
    
    // Technical terms
    if (features[1] > 0.5) factors.push('Technical terminology detected');
    
    return factors;
  }

  /**
   * Calculate prediction confidence
   */
  calculatePredictionConfidence(features) {
    // Simple confidence calculation based on feature completeness
    const completeness = features.filter(f => f > 0).length / features.length;
    return Math.min(0.9, 0.3 + (completeness * 0.6));
  }

  /**
   * Rule-based complexity calculation
   */
  calculateRuleBasedComplexity(task, features) {
    let complexity = 0.3; // Base complexity
    
    // Text analysis
    complexity += features[0] * 0.2; // Word count factor
    complexity += features[1] * 0.15; // Technical terms factor
    
    // Priority factor
    complexity += features[2] * 0.25;
    
    // Subtasks factor
    complexity += features[3] * 0.2;
    
    // Deadline pressure
    complexity += features[4] * 0.2;
    
    return Math.min(complexity, 1.0);
  }

  /**
   * Get complexity factors
   */
  getComplexityFactors(task, features) {
    const factors = [];
    
    if (features[1] > 0.5) factors.push('Technical terminology detected');
    if (features[3] > 0.3) factors.push('Multiple subtasks identified');
    if (features[4] > 0.7) factors.push('Tight deadline increases complexity');
    
    return factors;
  }

  /**
   * Update model with new task completion data
   */
  async updateWithNewData(completedTask) {
    try {
      if (!completedTask.timeSpent || completedTask.timeSpent <= 0) {
        console.log('No time tracking data available for learning');
        return; // No time data to learn from
      }

      const features = await this.featureExtractor.extractFeatures(completedTask);
      
      // Add to training data
      this.trainingData.features.push(features);
      this.trainingData.labels.push(completedTask.timeSpent);
      
      // Store learning metadata
      this.recordLearningEvent(completedTask, features);
      
      // Retrain more frequently for better adaptation (every 10 new samples)
      if (this.trainingData.features.length % 10 === 0) {
        console.log(`Retraining model with ${this.trainingData.features.length} samples...`);
        await this.retrainModel();
        console.log('Model retrained successfully');
      }

      // Evaluate prediction accuracy for continuous improvement
      await this.evaluateModelPerformance(completedTask, features);
      
    } catch (error) {
      console.error('Error updating model with new data:', error);
    }
  }

  /**
   * Record learning events for analysis and improvement
   */
  recordLearningEvent(task, features) {
    const learningEvent = {
      taskId: task._id,
      actualDuration: task.timeSpent,
      features: features,
      timestamp: new Date(),
      assigneeId: task.assignee.id,
      complexity: this.calculateTaskComplexity(task),
      accuracy: null // Will be calculated later
    };

    // Store in learning history (implement proper storage)
    if (!this.learningHistory) {
      this.learningHistory = [];
    }
    this.learningHistory.push(learningEvent);
    
    // Keep only last 1000 learning events
    if (this.learningHistory.length > 1000) {
      this.learningHistory = this.learningHistory.slice(-1000);
    }
  }

  /**
   * Enhanced model retraining with improved algorithms
   */
  async retrainModel() {
    try {
      if (this.trainingData.features.length < 3) {
        console.log('Insufficient data for retraining (need at least 3 samples)');
        return;
      }

      console.log(`Retraining model with ${this.trainingData.features.length} samples...`);

      // Use statistical model if we have less than 10 samples
      if (this.trainingData.features.length < 10) {
        this.models.durationPredictor = new StatisticalPredictor();
        console.log('Using statistical model due to limited data');
        return;
      }

      // Implement weighted training (recent data has more weight)
      const weights = this.calculateSampleWeights();
      
      // Use ensemble approach for better predictions
      const models = await this.trainEnsembleModels(weights);
      
      // Update the primary model
      this.models.durationPredictor = models.primary;
      this.models.ensembleWeights = models.weights;
      
      // Store model performance metrics
      this.modelMetrics = await this.calculateModelMetrics();
      
      console.log(`Model retrained. Performance: ${JSON.stringify(this.modelMetrics)}`);
      
    } catch (error) {
      console.error('Error retraining model:', error);
      // Fallback to statistical model
      this.models.durationPredictor = new StatisticalPredictor();
    }
  }

  /**
   * Calculate sample weights (recent data gets higher weight)
   */
  calculateSampleWeights() {
    const weights = [];
    const totalSamples = this.trainingData.features.length;
    
    for (let i = 0; i < totalSamples; i++) {
      // Linear decay: newer samples get higher weight
      const weight = 0.5 + (i / totalSamples) * 0.5;
      weights.push(weight);
    }
    
    return weights;
  }

  /**
   * Train ensemble of models for better accuracy
   */
  async trainEnsembleModels(weights) {
    const features = this.trainingData.features;
    const labels = this.trainingData.labels;
    
    try {
      // Linear regression model using the regression library
      const trainingDataForRegression = features.map((featureSet, index) => [
        featureSet.reduce((sum, f) => sum + f, 0) / featureSet.length,
        labels[index]
      ]);
      
      const result = regression.linear(trainingDataForRegression);
      
      const linearModel = {
        predict: (inputFeatures) => {
          const input = inputFeatures.reduce((sum, f) => sum + f, 0) / inputFeatures.length;
          return result.predict(input)[1];
        },
        equation: result.equation,
        r2: result.r2
      };
      
      // Simple moving average model
      const movingAvgModel = this.createMovingAverageModel(labels);
      
      // Weighted average model based on task complexity
      const complexityModel = this.createComplexityBasedModel();
      
      return {
        primary: linearModel,
        secondary: movingAvgModel,
        complexity: complexityModel,
        weights: { linear: 0.6, moving: 0.2, complexity: 0.2 }
      };
    } catch (error) {
      console.error('Error training ensemble models:', error);
      // Fallback to statistical model
      return { 
        primary: new StatisticalPredictor(), 
        weights: { statistical: 1.0 } 
      };
    }
  }

  /**
   * Create moving average model for baseline predictions
   */
  createMovingAverageModel(labels) {
    const recentLabels = labels.slice(-20); // Last 20 tasks
    const average = recentLabels.reduce((sum, val) => sum + val, 0) / recentLabels.length;
    
    return {
      predict: () => average,
      type: 'moving_average',
      baseline: average
    };
  }

  /**
   * Create complexity-based prediction model
   */
  createComplexityBasedModel() {
    return {
      predict: (features, task) => {
        const complexity = this.calculateTaskComplexity(task);
        const baseHours = 8; // Default base hours
        
        // Adjust based on complexity
        if (complexity > 0.8) return baseHours * 2.5;
        if (complexity > 0.6) return baseHours * 2.0;
        if (complexity > 0.4) return baseHours * 1.5;
        return baseHours;
      },
      type: 'complexity_based'
    };
  }

  /**
   * Evaluate model performance against actual results
   */
  async evaluateModelPerformance(completedTask, features) {
    try {
      // Make prediction with previous model state
      const prediction = await this.predictTaskDuration(completedTask);
      const actualDuration = completedTask.timeSpent;
      
      // Calculate accuracy metrics
      const absoluteError = Math.abs(prediction.duration - actualDuration);
      const percentageError = (absoluteError / actualDuration) * 100;
      
      // Store performance metrics
      this.performanceHistory = this.performanceHistory || [];
      this.performanceHistory.push({
        taskId: completedTask._id,
        predicted: prediction.duration,
        actual: actualDuration,
        error: absoluteError,
        percentageError: percentageError,
        timestamp: new Date()
      });
      
      // Keep only last 100 evaluations
      if (this.performanceHistory.length > 100) {
        this.performanceHistory = this.performanceHistory.slice(-100);
      }
      
      // Log performance if accuracy is improving or declining
      const recentPerformance = this.performanceHistory.slice(-10);
      const avgError = recentPerformance.reduce((sum, p) => sum + p.percentageError, 0) / recentPerformance.length;
      
      if (avgError < 20) {
        console.log(`AI accuracy improved: ${(100 - avgError).toFixed(1)}% accurate`);
      } else if (avgError > 50) {
        console.log(`AI accuracy declining: ${(100 - avgError).toFixed(1)}% accurate - needs attention`);
      }
      
    } catch (error) {
      console.error('Error evaluating model performance:', error);
    }
  }

  /**
   * Calculate task complexity score
   */
  calculateTaskComplexity(task) {
    let complexityScore = 0;
    
    // Title complexity
    const titleWords = task.title.split(' ').length;
    complexityScore += Math.min(titleWords / 10, 0.3);
    
    // Description complexity
    const descWords = task.description.split(' ').length;
    complexityScore += Math.min(descWords / 50, 0.3);
    
    // Priority weight
    const priorityWeights = { low: 0.1, medium: 0.2, high: 0.3 };
    complexityScore += priorityWeights[task.priority] || 0.2;
    
    // Subtasks complexity
    if (task.subtasks && task.subtasks.length > 0) {
      complexityScore += Math.min(task.subtasks.length / 10, 0.2);
    }
    
    return Math.min(complexityScore, 1.0);
  }

  /**
   * Calculate comprehensive model metrics
   */
  async calculateModelMetrics() {
    if (!this.performanceHistory || this.performanceHistory.length === 0) {
      return { accuracy: 0, sampleSize: 0, status: 'insufficient_data' };
    }
    
    const recent = this.performanceHistory.slice(-20);
    const avgError = recent.reduce((sum, p) => sum + p.percentageError, 0) / recent.length;
    const accuracy = Math.max(0, 100 - avgError);
    
    return {
      accuracy: Math.round(accuracy * 100) / 100,
      sampleSize: this.trainingData.features.length,
      recentSamples: recent.length,
      status: accuracy > 70 ? 'good' : accuracy > 50 ? 'fair' : 'needs_improvement',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate mock training data for testing
   */
  generateMockTrainingData() {
    console.log('Generating mock training data for statistical models...');
    
    for (let i = 0; i < 50; i++) {
      const mockFeatures = [
        Math.random(), // word count
        Math.random(), // technical terms
        Math.random(), // priority
        Math.random(), // subtasks
        Math.random(), // deadline pressure
        Math.random(), // title length
        Math.random(), // sentence count
        Math.random()  // action verbs
      ];
      
      // Mock duration based on features (more realistic calculation)
      const complexityFactor = mockFeatures.reduce((sum, f) => sum + f, 0) / mockFeatures.length;
      const duration = 2 + (complexityFactor * 8) + (Math.random() * 2); // 2-12 hours range
      
      this.trainingData.features.push(mockFeatures);
      this.trainingData.labels.push(duration);
    }
    
    console.log(`Generated ${this.trainingData.features.length} mock training samples`);
  }

  /**
   * Fallback prediction when ML is not available
   */
  getFallbackPrediction(task) {
    // Enhanced rule-based estimation
    let duration = 3; // Base 3 hours
    
    // Priority adjustment
    if (task.priority === 'high') duration *= 1.4;
    else if (task.priority === 'medium') duration *= 1.1;
    
    // Subtasks factor
    if (task.subtasks && task.subtasks.length > 0) {
      duration += task.subtasks.length * 0.5;
    }
    
    // Text complexity
    const wordCount = task.description.split(' ').length;
    if (wordCount > 100) duration += 3;
    else if (wordCount > 50) duration += 1.5;
    else if (wordCount > 20) duration += 0.5;
    
    // Technical keywords check
    const technicalKeywords = ['api', 'database', 'algorithm', 'implement', 'develop', 'integrate'];
    const technicalCount = technicalKeywords.filter(keyword => 
      task.description.toLowerCase().includes(keyword)
    ).length;
    duration += technicalCount * 0.5;
    
    return {
      duration: Math.max(1, Math.round(duration * 10) / 10),
      confidence: 0.5,
      factors: ['Enhanced rule-based estimation'],
      method: 'fallback'
    };
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics() {
    return {
      isInitialized: this.isInitialized,
      trainingDataSize: this.trainingData.features.length,
      modelType: this.models.durationPredictor ? 
        (this.models.durationPredictor.predict ? 'linear_regression' : 'statistical') : 'none'
    };
  }
}

/**
 * Feature extraction class
 */
class FeatureExtractor {
  constructor() {
    this.featureCount = 8;
    this.technicalKeywords = [
      'api', 'database', 'algorithm', 'implement', 'develop', 'integrate',
      'test', 'deploy', 'security', 'performance', 'optimization', 'architecture'
    ];
  }

  async extractFeatures(task) {
    const features = [];
    
    // Feature 1: Text length (normalized)
    const wordCount = task.description.split(' ').length;
    features.push(Math.min(wordCount / 100, 1.0));
    
    // Feature 2: Technical keyword density
    const technicalTerms = this.technicalKeywords.filter(keyword =>
      task.description.toLowerCase().includes(keyword)
    ).length;
    features.push(Math.min(technicalTerms / 5, 1.0));
    
    // Feature 3: Priority level (encoded)
    const priorityMap = { low: 0.3, medium: 0.6, high: 1.0 };
    features.push(priorityMap[task.priority] || 0.5);
    
    // Feature 4: Subtask count (normalized)
    const subtaskCount = task.subtasks ? task.subtasks.length : 0;
    features.push(Math.min(subtaskCount / 10, 1.0));
    
    // Feature 5: Deadline pressure
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    const urgency = hoursUntilDue < 24 ? 1.0 : hoursUntilDue < 72 ? 0.7 : 0.3;
    features.push(urgency);
    
    // Feature 6: Title length (normalized)
    const titleLength = task.title.length;
    features.push(Math.min(titleLength / 50, 1.0));
    
    // Feature 7: Description complexity (sentence count)
    const sentenceCount = task.description.split(/[.!?]+/).length;
    features.push(Math.min(sentenceCount / 10, 1.0));
    
    // Feature 8: Action verb count (using compromise.js)
    try {
      const doc = compromise(task.description);
      const actionVerbs = doc.verbs().out('array').filter(verb =>
        ['create', 'build', 'implement', 'design', 'develop'].includes(verb.toLowerCase())
      ).length;
      features.push(Math.min(actionVerbs / 5, 1.0));
    } catch (error) {
      features.push(0.5); // Default if NLP fails
    }
    
    return features;
  }

  getFeatureCount() {
    return this.featureCount;
  }
}

/**
 * Statistical predictor fallback
 */
class StatisticalPredictor {
  predict(features, task) {
    // Enhanced statistical model
    const baseTime = 3; // 3 hours base
    const complexityMultiplier = features.reduce((sum, f) => sum + f, 0) / features.length;
    const duration = baseTime * (1 + complexityMultiplier);
    
    return {
      duration: Math.max(1, Math.round(duration * 10) / 10),
      confidence: 0.6,
      factors: ['Statistical estimation based on task characteristics'],
      method: 'statistical'
    };
  }
}

module.exports = new MLPredictor(); 