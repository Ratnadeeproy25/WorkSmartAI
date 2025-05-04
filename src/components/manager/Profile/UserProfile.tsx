import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface Skill {
  name: string;
  rating: number;
  description: string;
}

interface TimelineItem {
  id: number;
  title: string;
  time: string;
  type: 'meeting' | 'planning' | 'review';
  color: string;
}

const UserProfile: React.FC = () => {
  const [activeTimelineFilter, setActiveTimelineFilter] = useState<string>('all');
  const [filteredTimeline, setFilteredTimeline] = useState<TimelineItem[]>([]);
  const performanceChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // User data
  const userData = {
    name: 'Sarah Johnson',
    title: 'Senior Project Manager',
    id: 'MG001',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    status: 'available',
    contactInfo: {
      email: 'sarah.johnson@worksmart.ai',
      phone: '+1 (555) 987-6543',
      location: 'San Francisco, USA',
      teamSize: '12 Members'
    },
    skills: [
      { 
        name: 'Leadership ⭐⭐⭐⭐⭐', 
        rating: 5, 
        description: 'Expert in team leadership and motivation with 8+ years of experience'
      },
      { 
        name: 'Project Management ⭐⭐⭐⭐⭐', 
        rating: 5, 
        description: 'Certified PMP with expertise in Agile and Scrum methodologies'
      },
      { 
        name: 'Strategic Planning ⭐⭐⭐⭐', 
        rating: 4, 
        description: 'Strong strategic thinking and business planning capabilities'
      },
      { 
        name: 'Conflict Resolution ⭐⭐⭐⭐', 
        rating: 4, 
        description: 'Experienced in handling team conflicts and maintaining harmony'
      },
      { 
        name: 'Budget Management ⭐⭐⭐⭐', 
        rating: 4, 
        description: 'Proficient in budget planning and resource allocation'
      }
    ],
    performanceData: [88, 90, 89, 92, 94, 93]
  };

  // Timeline data
  const timelineData: TimelineItem[] = [
    { 
      id: 1, 
      title: 'Quarterly Team Review', 
      time: '2h ago', 
      type: 'review',
      color: 'bg-blue-500'
    },
    { 
      id: 2, 
      title: 'Project Planning Session', 
      time: '5h ago', 
      type: 'planning',
      color: 'bg-green-500'
    },
    { 
      id: 3, 
      title: 'Performance Review', 
      time: '1d ago', 
      type: 'review',
      color: 'bg-yellow-500'
    }
  ];

  // Initialize performance chart
  useEffect(() => {
    if (performanceChartRef.current) {
      const ctx = performanceChartRef.current.getContext('2d');
      
      if (ctx) {
        // Cleanup previous chart
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        
        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Team Performance Score',
              data: userData.performanceData,
              borderColor: '#3b82f6',
              tension: 0.4,
              fill: true,
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                grid: {
                  display: false
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [userData.performanceData]);

  // Filter timeline items based on active filter
  useEffect(() => {
    if (activeTimelineFilter === 'all') {
      setFilteredTimeline(timelineData);
    } else {
      setFilteredTimeline(timelineData.filter(item => item.type === activeTimelineFilter));
    }
  }, [activeTimelineFilter]);

  const handleTimelineFilterClick = (filter: string) => {
    setActiveTimelineFilter(filter);
  };

  return (
    <div className="neo-box p-8">
      {/* User Profile Header */}
      <div className="flex items-center gap-8 mb-8">
        <div className="profile-avatar">
          <img 
            src={userData.avatar} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
          <div className="status-dot bg-green-500"></div>
          <button className="camera-button">
            <i className="bi bi-camera"></i>
          </button>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-gray-800">{userData.name}</h2>
            <button className="neo-button p-2">
              <i className="bi bi-pencil"></i>
            </button>
          </div>
          <p className="text-lg text-gray-600 mb-2">{userData.title}</p>
          <p className="text-sm text-gray-500 mb-4">Manager ID: {userData.id}</p>
          <select className="neo-input p-3 w-full text-gray-700">
            <option>🟢 Available for Meetings</option>
            <option>🟡 In a Meeting</option>
            <option>🔴 Focus Time</option>
          </select>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
        <div className="space-y-3">
          <div className="contact-info-item">
            <i className="bi bi-envelope text-blue-500"></i>
            <span className="text-gray-700">{userData.contactInfo.email}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-telephone text-green-500"></i>
            <span className="text-gray-700">{userData.contactInfo.phone}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-geo-alt text-red-500"></i>
            <span className="text-gray-700">{userData.contactInfo.location}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-people text-purple-500"></i>
            <span className="text-gray-700">Team Size: {userData.contactInfo.teamSize}</span>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Team Performance</h3>
        <canvas ref={performanceChartRef} className="w-full h-48"></canvas>
      </div>

      {/* Management Skills */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Management Skills</h3>
        <div className="flex flex-wrap gap-2">
          {userData.skills.map((skill, index) => (
            <div key={index} className="skill-badge">
              {skill.name}
              <span className="tooltip">{skill.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Management Timeline */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Management Timeline</h3>
        <div className="flex gap-2 mb-4">
          <button 
            className={`timeline-filter ${activeTimelineFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleTimelineFilterClick('all')}
          >
            All
          </button>
          <button 
            className={`timeline-filter ${activeTimelineFilter === 'meeting' ? 'active' : ''}`}
            onClick={() => handleTimelineFilterClick('meeting')}
          >
            Team Meetings
          </button>
          <button 
            className={`timeline-filter ${activeTimelineFilter === 'review' ? 'active' : ''}`}
            onClick={() => handleTimelineFilterClick('review')}
          >
            Reviews
          </button>
          <button 
            className={`timeline-filter ${activeTimelineFilter === 'planning' ? 'active' : ''}`}
            onClick={() => handleTimelineFilterClick('planning')}
          >
            Planning
          </button>
        </div>
        <div className="space-y-4">
          {filteredTimeline.map(item => (
            <div key={item.id} className="timeline-item">
              <div className={`timeline-dot ${item.color}`}></div>
              <div className="timeline-content">
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-time">{item.time}</div>
              </div>
            </div>
          ))}
          {filteredTimeline.length === 0 && (
            <div className="text-center py-4 text-gray-500">No timeline items found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 