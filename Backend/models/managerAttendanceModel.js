const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  checkOutLocation: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { _id: false });

const managerAttendanceSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
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

// Create a compound index for managerId and date to ensure unique records per day
managerAttendanceSchema.index({ managerId: 1, date: 1 }, { unique: true });

// Helper method to calculate work hours
managerAttendanceSchema.methods.calculateWorkHours = function() {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn).getTime();
    const checkOutTime = new Date(this.checkOut).getTime();
    return (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
  }
  return 0;
};

const ManagerAttendance = mongoose.model('ManagerAttendance', managerAttendanceSchema);

module.exports = ManagerAttendance; 