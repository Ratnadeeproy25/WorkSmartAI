const mongoose = require("mongoose");

const moodEntrySchema = new mongoose.Schema({
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'bad'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  note: {
    type: String
  }
}, { _id: false });

const activityEntrySchema = new mongoose.Schema({
  activity: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

const breakHistoryEntrySchema = new mongoose.Schema({
  timestamp: {
    type: Date, 
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  type: {
    type: String,
    enum: ['regular', 'mindfulness', 'exercise', 'social'],
    default: 'regular'
  }
}, { _id: false });

const reminderSettingsSchema = new mongoose.Schema({
  breaks: {
    enabled: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number, // in minutes
      default: 60
    },
    smartReminders: {
      type: Boolean,
      default: true
    }
  },
  mood: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'twice-daily', 'hourly'],
      default: 'daily'
    },
    time: {
      type: String,
      default: '09:00'
    },
    smartReminders: {
      type: Boolean,
      default: true
    }
  },
  activities: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily'
    },
    time: {
      type: String,
      default: '12:00'
    },
    days: {
      type: [Number], // 0-6 for days of the week
      default: [1, 3, 5]
    }
  }
}, { _id: false });

const employeeWellbeingSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  wellbeingMetrics: {
    workLifeBalance: {
      score: {
        type: Number,
        default: 85
      },
      history: {
        type: [Number],
        default: [82, 84, 85, 83, 85]
      },
      factors: {
        workHours: {
          type: Number,
          default: 7.5
        },
        breaksCount: {
          type: Number,
          default: 4
        },
        afterHoursWork: {
          type: Number,
          default: 0.5
        },
        focusTime: {
          type: Number,
          default: 5.2
        }
      }
    },
    stressLevel: {
      score: {
        type: Number,
        default: 90
      },
      history: {
        type: [Number],
        default: [88, 89, 90, 90, 90]
      },
      factors: {
        deadlinePressure: {
          type: String,
          default: 'Low'
        },
        workload: {
          type: String,
          default: 'Moderate'
        },
        teamSupport: {
          type: String,
          default: 'High'
        },
        workEnvironment: {
          type: String,
          default: 'Positive'
        }
      }
    },
    jobSatisfaction: {
      score: {
        type: Number,
        default: 88
      },
      history: {
        type: [Number],
        default: [85, 86, 87, 88, 88]
      },
              factors: {
          roleClarity: {
            type: String,
            default: 'High'
          },
          skillUtilization: {
            type: String,
            default: 'Optimal'
          },
          growthOpportunities: {
            type: String,
            default: 'Good'
          },
          teamDynamics: {
            type: String,
            default: 'Excellent'
          },
          taskCompletionRate: {
            type: String,
            default: '85%'
          }
        }
    },
    teamCollaboration: {
      score: {
        type: Number,
        default: 92
      },
      history: {
        type: [Number],
        default: [90, 91, 91, 92, 92]
      },
      factors: {
        communicationQuality: {
          type: String,
          default: 'Excellent'
        },
        peerSupport: {
          type: String,
          default: 'High'
        },
        conflictResolution: {
          type: String,
          default: 'Good'
        },
        teamworkEfficiency: {
          type: String,
          default: 'High'
        }
      }
    }
  },
  moodHistory: {
    type: [moodEntrySchema],
    default: []
  },
  activityHistory: {
    type: [activityEntrySchema],
    default: []
  },
  breakHistory: {
    type: [breakHistoryEntrySchema],
    default: []
  },
  reminderSettings: {
    type: reminderSettingsSchema,
    default: () => ({})
  },
  notificationTimestamps: {
    lastBreak: {
      type: Date,
      default: null
    },
    lastMood: {
      type: Date,
      default: null
    },
    lastActivity: {
      type: Date,
      default: null
    }
  }
}, { timestamps: true });

// Create index for fast lookups by employeeId
employeeWellbeingSchema.index({ employeeId: 1 });

const EmployeeWellbeing = mongoose.model("EmployeeWellbeing", employeeWellbeingSchema);

module.exports = EmployeeWellbeing; 