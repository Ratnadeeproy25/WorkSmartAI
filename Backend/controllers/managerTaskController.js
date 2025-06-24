const Task = require('../models/Task');
const Employee = require('../models/employeeModel');
const asyncHandler = require('express-async-handler');
const mlPredictor = require('../services/mlPredictor');
const { sanitizeTaskData } = require('../utils/htmlSanitizer');

/**
 * @desc    Get all tasks created by the manager
 * @route   GET /api/manager/tasks
 * @access  Private/Manager
 */
const getManagerTasks = asyncHandler(async (req, res) => {
  // Get the manager's ID
  const managerId = req.user._id;
  
  // First get all employees assigned to this manager
  const managedEmployees = await Employee.find({ manager: managerId }).select('_id');
  const managedEmployeeIds = managedEmployees.map(emp => emp._id.toString());
  
  // Get tasks created by the manager OR assigned to employees managed by this manager
  const tasks = await Task.find({
    $or: [
      { 'createdBy.id': req.user.id.toString() },
      { 'assignee.id': { $in: managedEmployeeIds } }
    ]
  });
  
  res.status(200).json(tasks);
});

/**
 * @desc    Get all tasks assigned to team members
 * @route   GET /api/manager/tasks/team
 * @access  Private/Manager
 */
const getTeamTasks = asyncHandler(async (req, res) => {
  // Get the manager's ID
  const managerId = req.user._id;
  
  // Get all employees assigned to this manager
  const managedEmployees = await Employee.find({ manager: managerId }).select('_id');
  const managedEmployeeIds = managedEmployees.map(emp => emp._id.toString());
  
  // Get tasks assigned to employees managed by this manager
  const tasks = await Task.find({
    'assignee.id': { $in: managedEmployeeIds },
    'assignee.id': { $ne: req.user.id.toString() } // Exclude tasks assigned to the manager
  });
  
  res.status(200).json(tasks);
});

/**
 * @desc    Get tasks by status
 * @route   GET /api/manager/tasks/status/:status
 * @access  Private/Manager
 */
const getTasksByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  
  // Validate status
  if (!['todo', 'inProgress', 'completed', 'blocked'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  // Get the manager's ID
  const managerId = req.user._id;
  
  // Get all employees assigned to this manager
  const managedEmployees = await Employee.find({ manager: managerId }).select('_id');
  const managedEmployeeIds = managedEmployees.map(emp => emp._id.toString());
  
  // Get tasks with the specified status that are either created by the manager
  // OR assigned to employees managed by this manager
  const tasks = await Task.find({
    $or: [
      { 'createdBy.id': req.user.id.toString() },
      { 'assignee.id': { $in: managedEmployeeIds } }
    ],
    status
  });
  
  res.status(200).json(tasks);
});

/**
 * @desc    Get a single task by ID
 * @route   GET /api/manager/tasks/:id
 * @access  Private/Manager
 */
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Get the manager's ID
  const managerId = req.user._id;
  
  // Check if the task was created by this manager
  const isCreator = task.createdBy.id === req.user.id.toString();
  
  // If not creator, check if task is assigned to an employee managed by this manager
  if (!isCreator) {
    // Find the employee assigned to this task
    const employee = await Employee.findOne({
      _id: task.assignee.id,
      manager: managerId
    });
    
    // If not found, the manager doesn't have access
    if (!employee) {
      res.status(403);
      throw new Error('Not authorized to access this task');
    }
  }

  res.status(200).json(task);
});

/**
 * @desc    Create a new task and assign to an employee
 * @route   POST /api/manager/tasks
 * @access  Private/Manager
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, status, dueDate, assigneeId, progress, subtasks } = req.body;

  if (!title || !description || !dueDate || !assigneeId) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Sanitize HTML content from title and description
  const sanitizedData = sanitizeTaskData({ title, description });

  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Manager creating task:', {
      managerId: req.user._id,
      assigneeId: assigneeId,
      title: sanitizedData.title
    });
  }

  // Find the assignee to get their name and custom id
  const assignee = await Employee.findById(assigneeId);
  
  if (!assignee) {
    res.status(404);
    throw new Error('Assignee not found');
  }

  // Verify that the assignee is managed by the current manager using robust validation
  const managerId = req.user._id;
  const managerCustomId = req.user.id;
  
  // Use the same robust logic as getTeamMembers to validate manager assignment
  let isValidAssignment = false;
  
  // Check 1: Direct ObjectId comparison
  if (assignee.manager && assignee.manager.toString() === managerId.toString()) {
    isValidAssignment = true;
  }
  
  // Check 2: Alternative searches if direct match fails
  if (!isValidAssignment) {
    try {
      const validAssignees = await Employee.find({ 
        $or: [
          { '_id': assigneeId, 'manager': managerCustomId }, // In case manager field contains string
          { '_id': assigneeId, 'manager': managerId } // Try with manager's ObjectId again
        ]
      });
      
      if (validAssignees.length > 0) {
        isValidAssignment = true;
      }
    } catch (alternativeError) {
      console.log('Alternative validation search failed:', alternativeError.message);
      
      // Check 3: Department-based fallback validation
      try {
        const Manager = require('../models/managerModel');
        const manager = await Manager.findById(managerId);
        
        if (manager && assignee.department === manager.department && assignee.role !== 'manager') {
          isValidAssignment = true;
        }
      } catch (deptError) {
        console.log('Department-based validation failed:', deptError.message);
      }
    }
  }
  
  if (!isValidAssignment) {
    console.log('Manager assignment validation failed:', {
      assigneeId: assignee._id,
      assigneeName: assignee.name,
      assigneeManager: assignee.manager,
      assigneeManagerType: typeof assignee.manager,
      currentManager: managerId,
      currentManagerCustomId: managerCustomId,
      assigneeDepartment: assignee.department
    });
    res.status(403);
    throw new Error('You can only assign tasks to employees you manage');
  }

  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Assignment validation passed. Found assignee:', {
      _id: assignee._id,
      name: assignee.name,
      manager: assignee.manager
    });
  }

  // Create task with specified assignee and current manager as creator
  const taskData = {
    title: sanitizedData.title,
    description: sanitizedData.description,
    priority: priority || 'medium',
    status: status || 'todo',
    dueDate,
    assignee: {
      id: assignee._id.toString(), // Store Mongo _id for fast lookup
      name: assignee.name,
      color: req.body.assignee?.color || '#3b82f6',
      customId: assignee.id // Store custom id as well
    },
    createdBy: {
      id: req.user.id.toString(),
      name: req.user.name,
      role: 'manager'
    },
    progress: progress || 0,
    subtasks: subtasks || []
  };

  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Creating task with data:', {
      assignee: taskData.assignee,
      createdBy: taskData.createdBy
    });
  }

  const task = await Task.create(taskData);

  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Task created successfully:', {
      taskId: task._id,
      assigneeData: task.assignee
    });
  }

  res.status(201).json(task);
});

/**
 * @desc    Update a task
 * @route   PUT /api/manager/tasks/:id
 * @access  Private/Manager
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Authorization check (as before)
  const managerId = req.user._id;
  const isCreator = task.createdBy.id === req.user.id.toString();
  if (!isCreator) {
    const employee = await Employee.findOne({ _id: task.assignee.id, manager: managerId });
    if (!employee) {
      res.status(403);
      throw new Error('Not authorized to update this task');
    }
  }

  const updateFields = {};

  // Handle assignee change first
  if (req.body.assigneeId && req.body.assigneeId !== task.assignee.id) {
    const newAssignee = await Employee.findById(req.body.assigneeId);
    if (!newAssignee) {
      res.status(404);
      throw new Error('New assignee not found');
    }
    
    // Verify that the new assignee is managed by the current manager using robust validation
    const managerCustomId = req.user.id;
    let isValidAssignment = false;
    
    // Check 1: Direct ObjectId comparison
    if (newAssignee.manager && newAssignee.manager.toString() === managerId.toString()) {
      isValidAssignment = true;
    }
    
    // Check 2: Alternative searches if direct match fails
    if (!isValidAssignment) {
      try {
        const validAssignees = await Employee.find({ 
          $or: [
            { '_id': req.body.assigneeId, 'manager': managerCustomId }, // In case manager field contains string
            { '_id': req.body.assigneeId, 'manager': managerId } // Try with manager's ObjectId again
          ]
        });
        
        if (validAssignees.length > 0) {
          isValidAssignment = true;
        }
      } catch (alternativeError) {
        console.log('Alternative validation search failed in update:', alternativeError.message);
        
        // Check 3: Department-based fallback validation
        try {
          const Manager = require('../models/managerModel');
          const manager = await Manager.findById(managerId);
          
          if (manager && newAssignee.department === manager.department && newAssignee.role !== 'manager') {
            isValidAssignment = true;
          }
        } catch (deptError) {
          console.log('Department-based validation failed in update:', deptError.message);
        }
      }
    }
    
    if (!isValidAssignment) {
      res.status(403);
      throw new Error('New assignee not found or not managed by you');
    }
    
    updateFields['assignee.id'] = newAssignee._id.toString();
    updateFields['assignee.name'] = newAssignee.name;
    updateFields['assignee.color'] = req.body.assignee?.color || newAssignee.color || '#3b82f6'; // Use newAssignee color as a fallback
  } else if (req.body.assignee && req.body.assignee.color && req.body.assignee.color !== task.assignee.color) {
    // Handle only color change if assignee ID is not changing
    updateFields['assignee.color'] = req.body.assignee.color;
  }

  // Update other task fields
  if (req.body.title) {
    const sanitizedTitle = sanitizeTaskData({ title: req.body.title });
    updateFields.title = sanitizedTitle.title;
  }
  if (req.body.description) {
    const sanitizedDescription = sanitizeTaskData({ description: req.body.description });
    updateFields.description = sanitizedDescription.description;
  }
  if (req.body.priority) updateFields.priority = req.body.priority;
  if (req.body.status) {
    updateFields.status = req.body.status;
    if (req.body.status === 'completed') {
      updateFields.progress = 100;
    } else if (task.status === 'completed' && req.body.status !== 'completed') {
      // If task was 'completed' and is moved to something else, reset progress unless specified
      updateFields.progress = req.body.progress !== undefined ? req.body.progress : 0;
    }
  }
  if (req.body.dueDate) updateFields.dueDate = req.body.dueDate;
  // Ensure progress is only set if status is not also setting it
  if (req.body.progress !== undefined && !(req.body.status === 'completed' && req.body.progress === 100)) {
     updateFields.progress = req.body.progress;
  }
  if (req.body.subtasks) updateFields.subtasks = req.body.subtasks;

  if (Object.keys(updateFields).length === 0) {
    return res.status(200).json(task); // No changes provided
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });

  // Automatically update AI model when task is completed
  if (updateFields.status === 'completed' && updatedTask.timeSpent > 0) {
    try {
      console.log(`Manager updated AI model with completed task: ${updatedTask.title}`);
      await mlPredictor.updateWithNewData(updatedTask);
    } catch (error) {
      console.error('Error updating AI model automatically:', error);
      // Don't fail the task update if AI update fails
    }
  }

  res.status(200).json(updatedTask);
});

/**
 * @desc    Update task status
 * @route   PATCH /api/manager/tasks/:id/status
 * @access  Private/Manager
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

  // Authorization check (as before)
  const managerId = req.user._id;
  const isCreator = task.createdBy.id === req.user.id.toString();
  if (!isCreator) {
    const employee = await Employee.findOne({ _id: task.assignee.id, manager: managerId });
    if (!employee) {
      res.status(403);
      throw new Error('Not authorized to update this task status');
    }
  }

  const updates = { status };
  if (status === 'completed') {
    updates.progress = 100;
  } else if (task.status === 'completed' && status !== 'completed') {
    // If task was 'completed' and is moved to something else, reset progress to 0
    // Allow progress to be set via full updateTask if specific value needed
    updates.progress = 0;
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    { $set: updates }, // Use $set for explicit update
    { new: true }
  );

  // Automatically update AI model when task is completed
  if (status === 'completed' && updatedTask.timeSpent > 0) {
    try {
      console.log(`Manager updated AI model with completed task: ${updatedTask.title}`);
      await mlPredictor.updateWithNewData(updatedTask);
    } catch (error) {
      console.error('Error updating AI model automatically:', error);
      // Don't fail the task update if AI update fails
    }
  }

  res.status(200).json(updatedTask);
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/manager/tasks/:id
 * @access  Private/Manager
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Get the manager's ID
  const managerId = req.user._id;
  
  // Check if the task was created by this manager
  const isCreator = task.createdBy.id === req.user.id.toString();
  
  // If not creator, check if task is assigned to an employee managed by this manager
  if (!isCreator) {
    // Find the employee assigned to this task
    const employee = await Employee.findOne({
      _id: task.assignee.id,
      manager: managerId
    });
    
    // If not found, the manager doesn't have access
    if (!employee) {
      res.status(403);
      throw new Error('Not authorized to delete this task');
    }
  }

  await Task.findByIdAndDelete(req.params.id);
  
  res.status(200).json({ message: 'Task removed successfully' });
});

/**
 * @desc    Get team members for task assignment
 * @route   GET /api/manager/tasks/team-members
 * @access  Private/Manager
 */
const getTeamMembers = asyncHandler(async (req, res) => {
  try {
    const managerId = req.user._id;
    const managerCustomId = req.user.id;

    console.log('🔍 Getting team members for task assignment - Manager ID:', managerId, 'Custom ID:', managerCustomId);

    // First try with ObjectId
    let teamMembers = await Employee.find({ manager: managerId })
      .select('_id id name email position department status profilePicture')
      .lean();

    console.log(`👥 Found ${teamMembers.length} team members assigned to manager ObjectId ${managerId}`);
    
    // If no team members found with ObjectId, try alternative approaches
    if (teamMembers.length === 0) {
      console.log('⚠️ No employees assigned to manager ObjectId for tasks, trying alternative searches...');
      
      // Try finding employees where manager field contains the custom ID as string
      try {
        const alternativeTeamMembers = await Employee.find({ 
          $or: [
            { 'manager': managerCustomId }, // In case manager field contains string
            { 'manager': managerId } // Try with manager's ObjectId again
          ]
        })
        .select('_id id name email position department status profilePicture')
        .lean();
        
        console.log(`🔄 Alternative search found ${alternativeTeamMembers.length} team members`);
        
        if (alternativeTeamMembers.length > 0) {
          teamMembers = alternativeTeamMembers;
        }
      } catch (alternativeError) {
        console.log('Alternative search failed for tasks:', alternativeError.message);
        
        // Final fallback: Get manager details and search by department
        try {
          const Manager = require('../models/managerModel');
          const manager = await Manager.findById(managerId);
          
          if (manager) {
            const departmentTeamMembers = await Employee.find({ 
              department: manager.department,
              role: { $ne: 'manager' } // Exclude other managers
            })
            .select('_id id name email position department status profilePicture')
            .lean();
            
            console.log(`🏢 Department-based search found ${departmentTeamMembers.length} potential team members`);
            teamMembers = departmentTeamMembers;
          }
        } catch (deptError) {
          console.log('Department-based search failed for tasks:', deptError.message);
        }
      }
    }

    console.log(`✅ Returning ${teamMembers.length} team members for task assignment`);
    
    res.status(200).json(teamMembers);
  } catch (error) {
    console.error('❌ Error getting team members for tasks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch team members',
      error: error.message 
    });
  }
});

module.exports = {
  getManagerTasks,
  getTeamTasks,
  getTasksByStatus,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTeamMembers
}; 