const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

/**
 * @desc    Get all tasks for an employee
 * @route   GET /api/tasks
 * @access  Private/Employee
 */
const getTasks = asyncHandler(async (req, res) => {
  // Get tasks for the current logged-in employee (only assigned to them)
  const employeeId = req.user._id.toString();
  const customId = req.user.id;
  // console.log('Fetching tasks for employee with ID:', employeeId);
  
  // Try multiple potential ID formats to ensure we find all tasks
  const tasks = await Task.find({
    $or: [
      { 'assignee.id': employeeId },
      { 'assignee.id': customId },
      { 'assignee.customId': customId }
    ]
  });

  // console.log(`Found ${tasks.length} tasks for employee`);
  // tasks.forEach(task => {
  //   console.log('Task:', {
  //     id: task._id,
  //     title: task.title,
  //     assignee: task.assignee
  //   });
  // });
  
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

  // Check if task is assigned to the current employee
  if (task.assignee.id !== req.user.id.toString()) {
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

  // Check if task is assigned to the current employee
  if (task.assignee.id !== req.user.id.toString()) {
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

  // Check if task is assigned to the current employee
  if (task.assignee.id !== req.user.id.toString()) {
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

  // Check if task is assigned to the current employee
  if (task.assignee.id !== req.user.id.toString()) {
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