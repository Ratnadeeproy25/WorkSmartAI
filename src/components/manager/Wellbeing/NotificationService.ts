import { ReminderSettings, NotificationTimestamps } from './types';

class NotificationService {
  private static instance: NotificationService;
  private timers: { [key: string]: number } = {};
  private listeners: { [key: string]: Function[] } = {
    'break': [],
    'mood': [],
    'activity': [],
    'teamWellbeing': []
  };

  private constructor() {}

  // Singleton pattern
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notifications based on user settings
  public init(settings: ReminderSettings): void {
    // Request notification permission if not already granted
    this.requestPermission();

    // Clear existing timers
    this.clearTimers();

    // Set up scheduled notifications
    this.setupScheduledNotifications(settings);

    // Set up smart notifications if enabled
    this.setupSmartNotifications(settings);
  }

  // Request browser permission for notifications
  private requestPermission(): void {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  // Clear all existing timers
  private clearTimers(): void {
    Object.keys(this.timers).forEach(key => {
      window.clearTimeout(this.timers[key]);
      window.clearInterval(this.timers[key]);
      delete this.timers[key];
    });
  }

  // Setup scheduled notifications based on settings
  private setupScheduledNotifications(settings: ReminderSettings): void {
    // Schedule break reminders
    if (settings.breaks.enabled && !settings.breaks.smartReminders) {
      const intervalMs = settings.breaks.interval * 60 * 1000;
      this.timers['break'] = window.setInterval(() => {
        this.showNotification('Break Time', 'Time to take a quick break to recharge!');
        this.notifyListeners('break');
      }, intervalMs);
    }

    // Schedule mood check-in reminders
    if (settings.mood.enabled && !settings.mood.smartReminders) {
      if (settings.mood.frequency === 'daily' && settings.mood.time) {
        this.scheduleTimeBasedNotification(
          'mood-daily',
          settings.mood.time,
          'Mood Check-in',
          'How are you feeling today?',
          'mood'
        );
      } else if (settings.mood.frequency === 'twice-daily') {
        this.scheduleTimeBasedNotification(
          'mood-morning',
          '09:00',
          'Morning Mood Check-in',
          'How are you feeling this morning?',
          'mood'
        );
        this.scheduleTimeBasedNotification(
          'mood-afternoon',
          '14:00',
          'Afternoon Mood Check-in',
          'How are you feeling this afternoon?',
          'mood'
        );
      } else if (settings.mood.frequency === 'hourly') {
        this.timers['mood'] = window.setInterval(() => {
          this.showNotification('Mood Check-in', 'How are you feeling right now?');
          this.notifyListeners('mood');
        }, 2 * 60 * 60 * 1000); // Every 2 hours
      }
    }

    // Schedule wellness activity reminders
    if (settings.activities.enabled) {
      if (settings.activities.frequency === 'daily' && settings.activities.time) {
        this.scheduleTimeBasedNotification(
          'activity-daily',
          settings.activities.time,
          'Wellness Activity',
          'Time for a wellness activity!',
          'activity'
        );
      } else if (settings.activities.frequency === 'weekly' && settings.activities.days && settings.activities.days.length > 0) {
        // Check for weekly day-based notifications
        this.setupWeeklyNotifications(settings);
      }
    }

    // Schedule team wellbeing check reminders
    if (settings.teamWellbeing?.enabled) {
      const day = settings.teamWellbeing.day;
      const time = settings.teamWellbeing.time || '10:00';
      const frequency = settings.teamWellbeing.frequency;
      
      // Schedule weekly team wellbeing check
      this.scheduleTeamWellbeingCheck(day, time, frequency);
    }
  }

  // Schedule team wellbeing check
  private scheduleTeamWellbeingCheck(day: number, time: string, frequency: 'weekly' | 'bi-weekly'): void {
    // Daily check at specified time to see if it's the right day for team wellbeing
    this.scheduleTimeBasedNotification(
      'team-wellbeing-check',
      time,
      '', // No notification, just a check
      '',
      'none' as any
    );

    // The check function
    const checkTeamWellbeingDay = () => {
      const today = new Date();
      const currentDay = today.getDay();
      const currentWeek = Math.floor(today.getDate() / 7); // Rough estimation of week number in month

      // For weekly checks, simply check if it's the right day
      if (frequency === 'weekly' && currentDay === day) {
        this.showNotification(
          'Team Wellbeing Check',
          'Today is scheduled for your team wellbeing check-in.'
        );
        this.notifyListeners('teamWellbeing');
      } 
      // For bi-weekly, check if it's the right day and right week (every other week)
      else if (frequency === 'bi-weekly' && currentDay === day && currentWeek % 2 === 0) {
        this.showNotification(
          'Bi-Weekly Team Wellbeing Check',
          'Today is scheduled for your bi-weekly team wellbeing check-in.'
        );
        this.notifyListeners('teamWellbeing');
      }
    };

    // Run check now in case the page loads on a check day
    checkTeamWellbeingDay();
    
    // Store the function
    this.timers['team-wellbeing-function'] = window.setTimeout(checkTeamWellbeingDay, 0);
  }

  // Schedule time-based notification (e.g., 9:00 AM)
  private scheduleTimeBasedNotification(
    id: string,
    timeString: string,
    title: string,
    body: string,
    type: 'break' | 'mood' | 'activity' | 'teamWellbeing' | 'none'
  ): void {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();
    
    this.timers[id] = window.setTimeout(() => {
      if (type !== 'none') {
        this.showNotification(title, body);
        this.notifyListeners(type);
      }

      // Schedule again for tomorrow
      this.scheduleTimeBasedNotification(id, timeString, title, body, type);
    }, delay);
  }

  // Setup weekly notifications for specific days
  private setupWeeklyNotifications(settings: ReminderSettings): void {
    // Check every day at 9:00 AM if it's a day to send a notification
    this.scheduleTimeBasedNotification(
      'activity-weekly-check',
      '09:00',
      '', // No notification, just a check
      '',
      'none' as any
    );

    // Add a check function that runs daily
    const checkDayFunction = () => {
      const today = new Date().getDay(); // 0-6 for Sunday-Saturday
      if (settings.activities.days?.includes(today)) {
        this.showNotification(
          'Weekly Wellness Activity',
          'Today is your scheduled day for a wellness activity!'
        );
        this.notifyListeners('activity');
      }
    };

    // Check now in case we're just loading the page on a scheduled day
    checkDayFunction();
    
    // Store the function to be called by the daily check
    this.timers['activity-weekly-function'] = window.setTimeout(checkDayFunction, 0);
  }

  // Setup smart notifications
  private setupSmartNotifications(settings: ReminderSettings): void {
    if (settings.breaks.enabled && settings.breaks.smartReminders) {
      // Check every hour if a break is needed
      this.timers['smart-break-check'] = window.setInterval(() => {
        this.checkSmartBreakReminder(settings.breaks.interval);
      }, 15 * 60 * 1000); // Check every 15 minutes
    }

    if (settings.mood.enabled && settings.mood.smartReminders) {
      // Check if mood hasn't been logged today
      this.timers['smart-mood-check'] = window.setInterval(() => {
        this.checkSmartMoodReminder();
      }, 60 * 60 * 1000); // Check every hour
    }
  }

  // Check if a break reminder is needed based on last break timestamp
  private checkSmartBreakReminder(interval: number): void {
    const timestamps = this.getTimestamps();
    const now = new Date();
    
    if (!timestamps.lastBreak) {
      // Never taken a break, suggest one after being active for a bit
      const startOfDay = new Date();
      startOfDay.setHours(9, 0, 0, 0); // Assuming workday starts at 9 AM
      
      if (now.getTime() - startOfDay.getTime() > interval * 60 * 1000) {
        this.showNotification('Time for a Break', 'You haven\'t taken a break yet today. Take a moment to recharge!');
        this.notifyListeners('break');
      }
    } else {
      // Check if time since last break exceeds the interval
      const lastBreakTime = new Date(timestamps.lastBreak);
      const timeSinceBreak = (now.getTime() - lastBreakTime.getTime()) / (60 * 1000); // in minutes
      
      if (timeSinceBreak > interval) {
        this.showNotification('Break Reminder', `It's been ${Math.floor(timeSinceBreak)} minutes since your last break. Time to recharge!`);
        this.notifyListeners('break');
      }
    }
  }

  // Check if a mood reminder is needed
  private checkSmartMoodReminder(): void {
    const timestamps = this.getTimestamps();
    const now = new Date();
    
    if (!timestamps.lastMood) {
      // Never logged mood today
      const currentHour = now.getHours();
      
      // Remind around lunch if no morning mood logged
      if (currentHour >= 12 && currentHour < 13) {
        this.showNotification('Mood Check-in', 'How are you feeling today? Take a moment to log your mood.');
        this.notifyListeners('mood');
      }
      // Remind in afternoon if still no mood logged
      else if (currentHour >= 15 && currentHour < 16) {
        this.showNotification('Afternoon Mood Check-in', 'You haven\'t logged your mood today. How are you feeling?');
        this.notifyListeners('mood');
      }
    } else {
      // Check if last mood was from a different day
      const lastMoodDate = new Date(timestamps.lastMood);
      
      if (lastMoodDate.toDateString() !== now.toDateString()) {
        // Last mood was from a previous day
        const currentHour = now.getHours();
        
        // Morning reminder
        if (currentHour >= 9 && currentHour < 10) {
          this.showNotification('Good Morning', 'How are you feeling today? Take a moment to log your mood.');
          this.notifyListeners('mood');
        }
      }
    }
  }

  // Update a timestamp when an action occurs
  public updateTimestamp(type: keyof NotificationTimestamps): void {
    const timestamps = this.getTimestamps();
    timestamps[type] = new Date().toISOString();
    localStorage.setItem('managerNotificationTimestamps', JSON.stringify(timestamps));
  }

  // Get timestamps from localStorage
  private getTimestamps(): NotificationTimestamps {
    const savedTimestamps = localStorage.getItem('managerNotificationTimestamps');
    const defaultTimestamps: NotificationTimestamps = {
      lastBreak: null,
      lastMood: null,
      lastActivity: null,
      lastTeamCheck: null
    };
    
    if (savedTimestamps) {
      try {
        return JSON.parse(savedTimestamps);
      } catch (error) {
        console.error('Error parsing timestamps', error);
        return defaultTimestamps;
      }
    }
    
    return defaultTimestamps;
  }

  // Show a browser notification
  public showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    } else {
      // Fallback to console or in-app notification
      console.log(`Notification: ${title} - ${body}`);
      this.showInAppNotification(title, body);
    }
  }

  // Show an in-app notification as a fallback
  private showInAppNotification(title: string, body: string): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 p-4 bg-blue-500 text-white rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="font-bold">${title}</div>
      <div>${body}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Add event listener for notification types
  public addEventListener(type: 'break' | 'mood' | 'activity' | 'teamWellbeing', callback: Function): void {
    if (this.listeners[type]) {
      this.listeners[type].push(callback);
    }
  }

  // Remove event listener
  public removeEventListener(type: 'break' | 'mood' | 'activity' | 'teamWellbeing', callback: Function): void {
    if (this.listeners[type]) {
      const index = this.listeners[type].indexOf(callback);
      if (index !== -1) {
        this.listeners[type].splice(index, 1);
      }
    }
  }

  // Notify all listeners of a particular type
  private notifyListeners(type: 'break' | 'mood' | 'activity' | 'teamWellbeing'): void {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => callback());
    }
  }
}

export default NotificationService.getInstance(); 