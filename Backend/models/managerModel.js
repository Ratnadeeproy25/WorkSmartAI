const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const managerSchema = new mongoose.Schema({
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
  officeLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: {
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" }
    }
  },
  assignedEmployees: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Hash password before saving
managerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
managerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for getting team members count (employees assigned to this manager)
managerSchema.virtual('teamSize').get(function() {
  return this._teamSize || 0;
});

managerSchema.set('toJSON', { virtuals: true });
managerSchema.set('toObject', { virtuals: true });

const Manager = mongoose.model("Manager", managerSchema);

module.exports = Manager; 