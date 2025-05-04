import React, { useState, useEffect } from 'react';
import { ReminderSettings } from './types';

interface ReminderSettingsProps {
  settings: ReminderSettings;
  onSettingsChange: (settings: ReminderSettings) => void;
}

const ReminderSettingsComponent: React.FC<ReminderSettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const updateSettings = (newSettings: Partial<ReminderSettings>) => {
    onSettingsChange({ ...settings, ...newSettings });
  };

  const updateBreakSettings = (breakSettings: Partial<ReminderSettings['breaks']>) => {
    updateSettings({
      breaks: { ...settings.breaks, ...breakSettings }
    });
  };

  const updateMoodSettings = (moodSettings: Partial<ReminderSettings['mood']>) => {
    updateSettings({
      mood: { ...settings.mood, ...moodSettings }
    });
  };

  const updateActivitySettings = (activitySettings: Partial<ReminderSettings['activities']>) => {
    updateSettings({
      activities: { ...settings.activities, ...activitySettings }
    });
  };

  return (
    <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff] mb-8">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="text-2xl font-bold text-gray-700">Reminder Settings</h2>
        <div className="flex items-center">
          <div className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-300 ease-in-out ${isOpen ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 space-y-6">
          {/* Break Reminders */}
          <div className="p-4 bg-[#e0e5ec] rounded-lg shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Break Reminders</h3>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={settings.breaks.enabled}
                  onChange={e => updateBreakSettings({ enabled: e.target.checked })}
                />
                <div className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-300 ease-in-out ${settings.breaks.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ease-in-out ${settings.breaks.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            
            {settings.breaks.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2">Remind me every:</label>
                  <select 
                    value={settings.breaks.interval}
                    onChange={e => updateBreakSettings({ interval: Number(e.target.value) })}
                    className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-gray-600">Smart Reminders</label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={settings.breaks.smartReminders}
                      onChange={e => updateBreakSettings({ smartReminders: e.target.checked })}
                    />
                    <div className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-300 ease-in-out ${settings.breaks.smartReminders ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ease-in-out ${settings.breaks.smartReminders ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>
                
                {settings.breaks.smartReminders && (
                  <div className="text-sm text-gray-500 italic">
                    You'll be reminded if you haven't taken a break in a while, based on your settings.
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mood Tracking Reminders */}
          <div className="p-4 bg-[#e0e5ec] rounded-lg shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Mood Check-in Reminders</h3>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={settings.mood.enabled}
                  onChange={e => updateMoodSettings({ enabled: e.target.checked })}
                />
                <div className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-300 ease-in-out ${settings.mood.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ease-in-out ${settings.mood.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            
            {settings.mood.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2">Frequency:</label>
                  <select 
                    value={settings.mood.frequency}
                    onChange={e => updateMoodSettings({ frequency: e.target.value as any })}
                    className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
                  >
                    <option value="daily">Once a day</option>
                    <option value="twice-daily">Twice a day</option>
                    <option value="hourly">Every few hours</option>
                  </select>
                </div>
                
                {settings.mood.frequency === 'daily' && (
                  <div>
                    <label className="block text-gray-600 mb-2">Time:</label>
                    <input 
                      type="time" 
                      value={settings.mood.time || "09:00"}
                      onChange={e => updateMoodSettings({ time: e.target.value })}
                      className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <label className="text-gray-600">Smart Reminders</label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={settings.mood.smartReminders}
                      onChange={e => updateMoodSettings({ smartReminders: e.target.checked })}
                    />
                    <div className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-300 ease-in-out ${settings.mood.smartReminders ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ease-in-out ${settings.mood.smartReminders ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>
                
                {settings.mood.smartReminders && (
                  <div className="text-sm text-gray-500 italic">
                    You'll be reminded if you haven't logged your mood today.
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Wellness Activities Reminders */}
          <div className="p-4 bg-[#e0e5ec] rounded-lg shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Wellness Activity Reminders</h3>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={settings.activities.enabled}
                  onChange={e => updateActivitySettings({ enabled: e.target.checked })}
                />
                <div className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-300 ease-in-out ${settings.activities.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ease-in-out ${settings.activities.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            
            {settings.activities.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2">Frequency:</label>
                  <select 
                    value={settings.activities.frequency}
                    onChange={e => updateActivitySettings({ frequency: e.target.value as any })}
                    className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                
                {settings.activities.frequency === 'daily' ? (
                  <div>
                    <label className="block text-gray-600 mb-2">Time:</label>
                    <input 
                      type="time" 
                      value={settings.activities.time || "12:00"}
                      onChange={e => updateActivitySettings({ time: e.target.value })}
                      className="w-full bg-[#e0e5ec] rounded-lg p-3 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] transition-all duration-300 outline-none border-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-600 mb-2">Days:</label>
                    <div className="flex flex-wrap gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <label key={index} className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.activities.days?.includes(index) || false}
                            onChange={(e) => {
                              const days = [...(settings.activities.days || [])];
                              if (e.target.checked) {
                                if (!days.includes(index)) days.push(index);
                              } else {
                                const dayIndex = days.indexOf(index);
                                if (dayIndex > -1) days.splice(dayIndex, 1);
                              }
                              updateActivitySettings({ days });
                            }}
                            className="hidden"
                          />
                          <div className={`px-3 py-1 rounded-full text-sm ${settings.activities.days?.includes(index) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {day}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderSettingsComponent; 