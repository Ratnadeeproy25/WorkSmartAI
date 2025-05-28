const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'inProgress', 'completed', 'blocked'],
    default: 'todo'
  },
  dueDate: {
    type: Date,
    required: true
  },
  assignee: {
    id: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    customId: {
      type: String,
      index: true,
      default: ''
    }
  },
  createdBy: {
    id: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      default: 'employee'
    }
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  subtasks: [subtaskSchema]
}, { timestamps: true });

// Virtual property to map createdAt to the expected format in frontend
taskSchema.virtual('createdAtISOString').get(function() {
  return this.createdAt.toISOString();
});

// Configure toJSON method for converting to desired output format
taskSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    ret.createdAt = ret.createdAtISOString;
    delete ret._id;
    delete ret.__v;
    delete ret.createdAtISOString;
    return ret;
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 