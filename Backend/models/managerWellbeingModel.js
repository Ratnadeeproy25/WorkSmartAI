const mongoose = require('mongoose');

const managerWellbeingSchema = mongoose.Schema(
  {
    managerId: {
      type: String,
      ref: 'Manager',
      required: true,
    },
    wellbeingMetrics: {
      workLifeBalance: {
        score: { type: Number, default: 75 },
        history: [{ type: Number }],
        factors: {
          workHours: { type: Number, default: 8 },
          breaksCount: { type: Number, default: 3 },
          afterHoursWork: { type: Number, default: 1 },
          focusTime: { type: Number, default: 5 },
        },
      },
      stressLevel: {
        score: { type: Number, default: 70 },
        history: [{ type: Number }],
        factors: {
          deadlinePressure: { type: String, default: 'Moderate' },
          workload: { type: String, default: 'Moderate' },
          teamSupport: { type: String, default: 'Moderate' },
          workEnvironment: { type: String, default: 'Neutral' },
        },
      },
      jobSatisfaction: {
        score: { type: Number, default: 80 },
        history: [{ type: Number }],
        factors: {
          roleClarity: { type: String, default: 'Good' },
          skillUtilization: { type: String, default: 'Good' },
          growthOpportunities: { type: String, default: 'Moderate' },
          teamDynamics: { type: String, default: 'Good' },
        },
      },
      teamCollaboration: {
        score: { type: Number, default: 80 },
        history: [{ type: Number }],
        factors: {
          communicationQuality: { type: String, default: 'Good' },
          peerSupport: { type: String, default: 'Good' },
          conflictResolution: { type: String, default: 'Moderate' },
          teamworkEfficiency: { type: String, default: 'Good' },
        },
      },
      teamWellbeing: {
        workLifeBalance: {
          score: { type: Number, default: 75 },
          history: [{ type: Number }],
        },
        stressLevel: {
          score: { type: Number, default: 70 },
          history: [{ type: Number }],
        },
        satisfaction: {
          score: { type: Number, default: 75 },
          history: [{ type: Number }],
        },
        collaboration: {
          score: { type: Number, default: 80 },
          history: [{ type: Number }],
        },
      },
    },
    moodHistory: [
      {
        mood: {
          type: String,
          enum: ['great', 'good', 'okay', 'bad'],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
        },
      },
    ],
    activityHistory: [
      {
        activity: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    breakHistory: [
      {
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
        },
        duration: {
          type: Number, // in minutes
        },
        type: {
          type: String,
          enum: ['regular', 'lunch', 'wellness', 'other', 'mindfulness', 'exercise', 'social'],
          default: 'regular',
        },
      },
    ],
    reminderSettings: {
      breaks: {
        enabled: { type: Boolean, default: true },
        interval: { type: Number, default: 60 }, // minutes
        smartReminders: { type: Boolean, default: true },
      },
      mood: {
        enabled: { type: Boolean, default: true },
        frequency: {
          type: String,
          enum: ['daily', 'twice-daily', 'hourly'],
          default: 'daily',
        },
        time: { type: String, default: '09:00' },
        smartReminders: { type: Boolean, default: true },
      },
      activities: {
        enabled: { type: Boolean, default: true },
        frequency: {
          type: String,
          enum: ['daily', 'weekly'],
          default: 'weekly',
        },
        days: [{ type: Number }], // 0-6 for days of week
        time: { type: String, default: '10:00' },
      },
      teamWellbeing: {
        enabled: { type: Boolean, default: true },
        frequency: {
          type: String,
          enum: ['weekly', 'bi-weekly'],
          default: 'weekly',
        },
        day: { type: Number, default: 1 }, // Monday
        time: { type: String, default: '10:00' },
      },
    },
    notificationTimestamps: {
      lastBreak: { type: Date },
      lastMood: { type: Date },
      lastActivity: { type: Date },
      lastTeamCheck: { type: Date },
    },
  },
  { 
    timestamps: true,
    collection: 'managerwellbeings' // Explicitly set collection name
  }
);

// Create index for fast lookups by managerId
managerWellbeingSchema.index({ managerId: 1 });

module.exports = mongoose.model('ManagerWellbeing', managerWellbeingSchema); 