const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  endorsements: {
    type: Number,
    default: 0
  }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'bg-blue-500'
  }
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  role: {
    type: String,
    enum: ['employee', 'manager'],
    default: 'employee'
  },
  profilePicture: {
    type: String,
    default: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  phone: {
    type: String,
    default: ""
  },
  location: {
    type: String,
    default: ""
  },
  shiftTime: {
    start: { type: String, default: "09:00" },
    end: { type: String, default: "17:00" }
  },
  workLocation: {
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" }
  },
  leaveBalances: {
    annualLeave: {
      total: { type: Number, default: 20 },
      used: { type: Number, default: 0 }
    },
    sickLeave: {
      total: { type: Number, default: 10 },
      used: { type: Number, default: 0 }
    },
    personalLeave: {
      total: { type: Number, default: 25 },
      used: { type: Number, default: 0 }
    }
  },
  officeLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  technicalSkills: {
    type: [skillSchema],
    default: []
  },
  softSkills: {
    type: [skillSchema],
    default: []
  },
  performanceData: {
    type: [Number],
    default: [85, 88, 87, 90, 92, 91]
  },
  recentActivities: {
    type: [activitySchema],
    default: []
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: false,
    index: true
  }
}, { timestamps: true });

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee; 