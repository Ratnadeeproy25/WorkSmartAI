const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

/**
 * @desc    Get all tasks for an employee
 * @route   GET /api/tasks
 * @access  Private/Employee
 */
const getTasks = asyncHandler(async (req, res) => {
  // Get the employee's MongoDB _id and custom id
  const employeeMongoId = req.user._id.toString();
  const employeeCustomId = req.user.id;
  
  // Only log in development or when debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('Fetching tasks for employee:', {
      mongoId: employeeMongoId,
      customId: employeeCustomId,
      name: req.user.name
    });
  }
  
  // Build comprehensive search query to find tasks assigned to this employee
  // Search by MongoDB _id (most common case) and custom id as fallback
  const searchQuery = {
    $or: [
      { 'assignee.id': employeeMongoId },       // MongoDB _id stored as string
      { 'assignee.id': employeeCustomId },      // Custom ID stored in assignee.id
      { 'assignee.customId': employeeCustomId }, // Custom ID stored in assignee.customId
    ]
  };
  
  // Remove any falsy values from the search query
  searchQuery.$or = searchQuery.$or.filter(condition => {
    const value = Object.values(condition)[0];
    return value && value !== '';
  });
  
  const tasks = await Task.find(searchQuery);

  // Only log details in development or when there are issues
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Found ${tasks.length} tasks for employee ${req.user.name}`);
  }
  
  // If no tasks found in development, help debug
  if (tasks.length === 0 && process.env.NODE_ENV !== 'production') {
    const allTasks = await Task.find({}).limit(3);
    console.log('No tasks found. Sample tasks in database:', allTasks.map(task => ({
      title: task.title,
      assignee: task.assignee
    })));
  }
  
  res.status(200).json(tasks);
});

/**
 * @desc    Get a single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private/Employee
 */
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task is assigned to the current employee using same logic as getTasks
  const employeeMongoId = req.user._id.toString();
  const employeeCustomId = req.user.id;
  
  const isAssignedToEmployee = 
    task.assignee.id === employeeMongoId || 
    task.assignee.id === employeeCustomId || 
    task.assignee.customId === employeeCustomId;

  if (!isAssignedToEmployee) {
    console.log('Task access denied:', {
      taskId: req.params.id,
      taskAssignee: task.assignee,
      employeeMongoId,
      employeeCustomId
    });
    res.status(403);
    throw new Error('Not authorized to access this task');
  }

  res.status(200).json(task);
});

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private/Employee
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, status, dueDate, progress, subtasks } = req.body;

  if (!title || !description || !dueDate) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Create task with current user as assignee and creator
  const task = await Task.create({
    title,
    description,
    priority: priority || 'medium',
    status: status || 'todo',
    dueDate,
    assignee: {
      id: req.user.id.toString(),
      name: req.user.name,
      color: req.body.assignee?.color || '#3b82f6'
    },
    createdBy: {
      id: req.user.id.toString(),
      name: req.user.name,
      role: req.user.role || 'employee'
    },
    progress: progress || 0,
    subtasks: subtasks || []
  });

  res.status(201).json(task);
});

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private/Employee
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task belongs to the current user (created by them or assigned to them)
  if (task.createdBy?.id !== req.user.id.toString() && task.assignee.id !== req.user.id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  // Update task
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title || task.title,
      description: req.body.description || task.description,
      priority: req.body.priority || task.priority,
      status: req.body.status || task.status,
      dueDate: req.body.dueDate || task.dueDate,
      progress: req.body.progress !== undefined ? req.body.progress : task.progress,
      subtasks: req.body.subtasks || task.subtasks,
      timeSpent: req.body.timeSpent !== undefined ? req.body.timeSpent : task.timeSpent
    },
    { new: true }
  );

  res.status(200).json(updatedTask);
});

/**
 * @desc    Update task status
 * @route   PATCH /api/tasks/:id/status
 * @access  Private/Employee
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status) {
    res.status(400);
    throw new Error('Please provide status');
  }

  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task is assigned to the current employee using same logic as getTasks
  const employeeMongoId = req.user._id.toString();
  const employeeCustomId = req.user.id;
  
  const isAssignedToEmployee = 
    task.assignee.id === employeeMongoId || 
    task.assignee.id === employeeCustomId || 
    task.assignee.customId === employeeCustomId;

  if (!isAssignedToEmployee) {
    console.log('Task update access denied:', {
      taskId: req.params.id,
      taskAssignee: task.assignee,
      employeeMongoId,
      employeeCustomId
    });
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  // Update status and progress if marked as completed
  const updates = { status };
  if (status === 'completed') {
    updates.progress = 100;
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
  );

  res.status(200).json(updatedTask);
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private/Employee
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task was created by the current user
  if (task.createdBy?.id !== req.user.id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this task - only the creator can delete tasks');
  }

  await Task.findByIdAndDelete(req.params.id);
  
  res.status(200).json({ message: 'Task removed successfully' });
});

/**
 * @desc    Update task progress
 * @route   PATCH /api/tasks/:id/progress
 * @access  Private/Employee
 */
const updateTaskProgress = asyncHandler(async (req, res) => {
  const { progress } = req.body;
  
  if (progress === undefined) {
    res.status(400);
    throw new Error('Please provide progress value');
  }

  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task is assigned to the current employee using same logic as getTasks
  const employeeMongoId = req.user._id.toString();
  const employeeCustomId = req.user.id;
  
  const isAssignedToEmployee = 
    task.assignee.id === employeeMongoId || 
    task.assignee.id === employeeCustomId || 
    task.assignee.customId === employeeCustomId;

  if (!isAssignedToEmployee) {
    console.log('Task progress update access denied:', {
      taskId: req.params.id,
      taskAssignee: task.assignee,
      employeeMongoId,
      employeeCustomId
    });
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  // Update progress and status if needed
  const updates = { progress };
  if (progress === 100 && task.status !== 'completed') {
    updates.status = 'completed';
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
  );

  res.status(200).json(updatedTask);
});

/**
 * @desc    Update time spent on task
 * @route   PATCH /api/tasks/:id/time
 * @access  Private/Employee
 */
const updateTaskTime = asyncHandler(async (req, res) => {
  const { timeSpent } = req.body;
  
  if (timeSpent === undefined) {
    res.status(400);
    throw new Error('Please provide timeSpent value');
  }

  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task is assigned to the current employee using same logic as getTasks
  const employeeMongoId = req.user._id.toString();
  const employeeCustomId = req.user.id;
  
  const isAssignedToEmployee = 
    task.assignee.id === employeeMongoId || 
    task.assignee.id === employeeCustomId || 
    task.assignee.customId === employeeCustomId;

  if (!isAssignedToEmployee) {
    console.log('Task time update access denied:', {
      taskId: req.params.id,
      taskAssignee: task.assignee,
      employeeMongoId,
      employeeCustomId
    });
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    { timeSpent },
    { new: true }
  );

  res.status(200).json(updatedTask);
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  updateTaskProgress,
  updateTaskTime
}; 