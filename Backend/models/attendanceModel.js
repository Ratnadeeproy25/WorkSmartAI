const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  checkOutLocation: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workHours: {
      type: Number,
      default: 0,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave', 'late'],
      default: 'absent',
    },
  },
  { timestamps: true }
);

// Create a compound index for employeeId and date to ensure unique records per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Helper method to calculate work hours
attendanceSchema.methods.calculateWorkHours = function() {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn).getTime();
    const checkOutTime = new Date(this.checkOut).getTime();
    return (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
  }
  return 0;
};

// Status and work hours are now calculated in the controller based on employee-specific shift time
// No longer using pre-save middleware with hard-coded shift time values

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 