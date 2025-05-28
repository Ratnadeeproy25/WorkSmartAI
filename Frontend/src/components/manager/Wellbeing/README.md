# Manager Wellbeing System

This document explains how the Manager Wellbeing System works, including how scores are calculated and what factors are tracked.

## Overview

The Manager Wellbeing System tracks four key metrics for individual managers:

1. **Work-Life Balance** - Automatically calculated from work patterns
2. **Stress Level** - Based on workload and environmental factors
3. **Job Satisfaction** - Combines role clarity, skill utilization, and performance
4. **Team Collaboration** - Measures management and communication effectiveness

## Wellbeing Metrics Calculation

### 1. Work-Life Balance (Automatic Calculation)

**Score Range:** 70-100%

**Factors Tracked:**
- `workHours`: Average work hours per day
- `breaksCount`: Number of breaks taken daily
- `afterHoursWork`: Hours worked after regular hours
- `focusTime`: Estimated focused work time

**Calculation Logic:**
- **Base Score:** 70%
- **Work Hours (25% weight):**
  - 7-8 hours: +7.5 points (ideal)
  - <7 hours: +5 points (efficient)
  - >10 hours: -7.5 points (excessive)
  - 8-10 hours: gradual penalty (-2 points per hour over 8)
- **Breaks Count (25% weight):**
  - ≥3 breaks: +7.5 points
  - 1-2 breaks: +5 points
  - 0 breaks: -5 points
- **After Hours Work (25% weight):**
  - 0 hours: +7.5 points
  - ≤1 hour: +2.5 points
  - >1 hour: -2 points per hour
- **Focus Time (25% weight):**
  - ≥5 hours: +7.5 points
  - 3-5 hours: +5 points
  - <3 hours: +2.5 points

### 2. Stress Level (Mixed Calculation)

**Score Range:** 50-100% (higher is better)

**Factors Tracked:**
- `deadlinePressure`: Based on task due dates (High/Moderate/Low) - **Auto-calculated**
- `workload`: Based on number of active tasks (Heavy/Moderate/Light) - **Auto-calculated**
- `teamSupport`: Manager assessment (High/Moderate/Low) - **Manual**
- `workEnvironment`: Manager assessment (Positive/Neutral/Negative) - **Manual**

**Calculation Logic:**
- **Base Score:** 85%
- **Deadline Pressure (30% weight):**
  - High: -9 points
  - Moderate: -4.5 points
  - Low: 0 points
- **Workload (30% weight):**
  - Heavy: -9 points
  - Moderate: -3 points
  - Light: +3 points
- **Team Support (20% weight):**
  - High: +6 points
  - Moderate: +3 points
  - Low: -3 points
- **Work Environment (20% weight):**
  - Positive: +6 points
  - Neutral: 0 points
  - Negative: -6 points

**Auto-calculation Rules:**
- **Deadline Pressure:**
  - High: >3 overdue tasks OR >5 tasks due in next 3 days
  - Moderate: 1-3 overdue tasks OR 2-5 tasks due in next 3 days
  - Low: ≤1 overdue task AND ≤2 tasks due in next 3 days
- **Workload:**
  - Heavy: >10 active tasks OR >5 high-priority tasks
  - Moderate: 5-10 active tasks OR 2-5 high-priority tasks
  - Light: <5 active tasks AND ≤2 high-priority tasks

### 3. Job Satisfaction (Mixed Calculation)

**Score Range:** 60-100%

**Factors Tracked:**
- `roleClarity`: Manager assessment (High/Good/Moderate/Low) - **Manual**
- `skillUtilization`: Manager assessment (Optimal/Good/Moderate/Underutilized) - **Manual**
- `growthOpportunities`: Manager assessment (Good/Moderate/Limited) - **Manual**
- `teamDynamics`: Manager assessment (Excellent/Good/Moderate/Poor) - **Manual**
- `taskCompletionRate`: Calculated from task data - **Auto-calculated**

**Calculation Logic:**
- **Base Score:** 70%
- **Role Clarity (20% weight):**
  - High: +6 points
  - Good: +4 points
  - Moderate: +2 points
  - Low: -2 points
- **Skill Utilization (20% weight):**
  - Optimal: +6 points
  - Good: +4 points
  - Moderate: +2 points
  - Underutilized: -2 points
- **Growth Opportunities (20% weight):**
  - Good: +6 points
  - Moderate: +3 points
  - Limited: -3 points
- **Team Dynamics (20% weight):**
  - Excellent: +6 points
  - Good: +4 points
  - Moderate: +2 points
  - Poor: -4 points
- **Task Completion Rate (20% weight):**
  - ≥90%: +6 points
  - 80-89%: +4 points
  - 70-79%: +2 points
  - 60-69%: 0 points
  - <60%: -3 points

### 4. Team Collaboration (Manual Configuration)

**Score Range:** 60-100%

**Factors Tracked:**
- `communicationQuality`: Manager assessment (Excellent/Good/Moderate/Poor) - **Manual**
- `peerSupport`: Manager assessment (High/Moderate/Low) - **Manual**
- `conflictResolution`: Manager assessment (Good/Moderate/Poor) - **Manual**
- `teamworkEfficiency`: Manager assessment (High/Moderate/Low) - **Manual**

**Calculation Logic:**
- **Base Score:** 70%
- **Communication Quality (25% weight):**
  - Excellent: +7.5 points
  - Good: +5 points
  - Moderate: +2.5 points
  - Poor: -2.5 points
- **Peer Support (25% weight):**
  - High: +7.5 points
  - Moderate: +5 points
  - Low: -2.5 points
- **Conflict Resolution (25% weight):**
  - Good: +7.5 points
  - Moderate: +5 points
  - Poor: -2.5 points
- **Teamwork Efficiency (25% weight):**
  - High: +7.5 points
  - Moderate: +5 points
  - Low: -2.5 points

## Data Sources

### Automatic Data Sources
- **Task Management System:** Provides task completion rates, deadlines, priorities
- **Attendance System:** Provides work hours, break patterns, overtime data
- **Time Tracking:** Provides focus time estimates

### Manual Configuration
- **Wellbeing Factors Editor:** Allows managers to update static factors
- **Mood Tracking:** Influences overall wellbeing trends
- **Break Timer:** Records break patterns for work-life balance calculation

## Features

### 1. Real-time Score Calculation
- Scores are recalculated whenever underlying data changes
- Automatic updates every 5 minutes
- Immediate updates when manual factors are changed

### 2. Historical Tracking
- Maintains history of all wellbeing scores
- Trend analysis and visualization
- Performance tracking over time

### 3. Manager-Specific Data
- All calculations are based on individual manager's data
- Personalized recommendations and insights
- Role-appropriate metrics and thresholds

### 4. Configurable Factors
- Static factors can be updated through the UI
- Automatic factors are calculated from system data
- Clear distinction between manual and automatic factors

## Components

### Core Components
- `WellbeingContext`: Manages state and calculations
- `ManagerWellbeingOverview`: Displays current scores and insights
- `WellbeingFactorsEditor`: Allows editing of manual factors
- `WellbeingCharts`: Visualizes trends and comparisons

### Supporting Components
- `MoodTracking`: Records mood entries
- `BreakTimer`: Manages break tracking
- `ReminderSettings`: Configures notifications
- `WellbeingTips`: Provides recommendations

## API Integration

### Endpoints Used
- `GET /api/manager/wellbeing` - Fetch wellbeing data
- `PATCH /api/manager/wellbeing/metrics` - Update wellbeing metrics
- `POST /api/manager/wellbeing/mood` - Record mood entry
- `POST /api/manager/wellbeing/breaks/start` - Start break
- `POST /api/manager/wellbeing/breaks/:id/end` - End break

### Data Flow
1. Frontend requests wellbeing data from backend
2. Backend calculates automatic factors from task/attendance data
3. Frontend applies calculation formulas to get scores
4. Manual factor updates are sent to backend
5. Scores are recalculated and UI is updated

## Usage

### For Managers
1. **View Current Status:** Check the overview dashboard for current wellbeing scores
2. **Update Factors:** Use the Factors Editor to update manual assessments
3. **Track Trends:** Monitor progress through charts and historical data
4. **Take Action:** Follow recommendations based on scores and insights

### For Developers
1. **Extend Calculations:** Modify calculation functions in `WellbeingContext`
2. **Add Factors:** Update interfaces and calculation logic
3. **Customize UI:** Modify components to change presentation
4. **Integrate Data:** Connect additional data sources through services

## Best Practices

### For Accurate Tracking
- Update manual factors regularly (weekly/monthly)
- Ensure task management system is up-to-date
- Use break timer consistently
- Record mood entries regularly

### For System Maintenance
- Monitor API performance and data quality
- Validate calculation results periodically
- Keep factor weights and thresholds updated
- Test with real manager data

## Troubleshooting

### Common Issues
1. **Scores not updating:** Check API connectivity and data sources
2. **Incorrect calculations:** Verify factor values and calculation logic
3. **Missing data:** Ensure all required data sources are available
4. **Performance issues:** Check for memory leaks in chart components

### Debug Information
- All calculations are logged to console in development
- Error states are displayed in UI components
- Fallback values are used when data is unavailable
- Retry mechanisms are built into data fetching 