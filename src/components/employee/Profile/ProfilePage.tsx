import React, { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import SecuritySettings from './SecuritySettings';
import { UserProfile, SecuritySettings as SecuritySettingsType } from './types';
import Sidebar from '../Sidebar';

const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "John Doe",
    role: "Senior Developer",
    employeeId: "EM001",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    status: "available",
    contactInfo: {
      email: "john.doe@worksmart.ai",
      phone: "+1 (555) 123-4567",
      location: "New York, USA"
    },
    skills: {
      technical: [
        { name: 'JavaScript', level: 5, endorsements: 12 },
        { name: 'React', level: 4, endorsements: 8 },
        { name: 'Node.js', level: 3, endorsements: 6 },
        { name: 'Python', level: 4, endorsements: 10 }
      ],
      soft: [
        { name: 'Communication', level: 4, endorsements: 15 },
        { name: 'Leadership', level: 3, endorsements: 7 },
        { name: 'Problem Solving', level: 5, endorsements: 14 },
        { name: 'Teamwork', level: 4, endorsements: 16 }
      ]
    },
    performanceData: [85, 88, 87, 90, 92, 91],
    timeline: [
      { id: '1', title: 'Completed Project Milestone', time: '2h ago', color: 'bg-blue-500' },
      { id: '2', title: 'Team Meeting', time: '5h ago', color: 'bg-green-500' },
      { id: '3', title: 'Code Review', time: '1d ago', color: 'bg-yellow-500' }
    ]
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsType>({
    sessions: [
      {
        id: '1',
        title: 'Chrome - Windows',
        lastActive: '2 minutes ago',
        device: 'windows',
        ip: '192.168.1.1',
        location: 'New York, USA',
        icon: 'bi-windows',
        iconColor: 'text-blue-500'
      },
      {
        id: '2',
        title: 'Safari - iPhone',
        lastActive: '1 hour ago',
        device: 'iphone',
        ip: '192.168.1.2',
        location: 'Boston, USA',
        icon: 'bi-phone',
        iconColor: 'text-green-500'
      }
    ],
    loginHistory: [
      {
        id: '1',
        device: 'Chrome - Windows',
        location: 'New York, USA',
        ip: '192.168.1.1',
        time: '2 days ago'
      },
      {
        id: '2',
        device: 'Safari - iPhone',
        location: 'Boston, USA',
        ip: '192.168.1.2',
        time: '5 days ago'
      }
    ]
  });

  // Handle profile picture update
  const handleProfilePictureUpdate = (imageUrl: string) => {
    setUserProfile((prev) => ({
      ...prev,
      profilePicture: imageUrl
    }));
    localStorage.setItem('profilePicture', imageUrl);
    showNotification('Profile picture updated successfully', 'success');
  };

  // Handle status change
  const handleStatusChange = (status: 'available' | 'away' | 'busy') => {
    setUserProfile((prev) => ({
      ...prev,
      status
    }));
  };

  // Handle skill endorsement
  const handleEndorseSkill = (category: 'technical' | 'soft', skillName: string) => {
    setUserProfile((prev) => {
      const updatedSkills = {...prev.skills};
      const skillIndex = updatedSkills[category].findIndex(s => s.name === skillName);
      
      if (skillIndex !== -1) {
        updatedSkills[category][skillIndex].endorsements += 1;
      }
      
      return {
        ...prev,
        skills: updatedSkills
      };
    });
    
    showNotification(`Skill "${skillName}" endorsed`, 'success');
  };

  // Handle skill level update
  const handleUpdateSkillLevel = (category: 'technical' | 'soft', skillName: string, newLevel: number) => {
    setUserProfile((prev) => {
      const updatedSkills = {...prev.skills};
      const skillIndex = updatedSkills[category].findIndex(s => s.name === skillName);
      
      if (skillIndex !== -1) {
        updatedSkills[category][skillIndex].level = Math.min(newLevel, 5);
      }
      
      return {
        ...prev,
        skills: updatedSkills
      };
    });
  };

  // Handle adding a new skill
  const handleAddSkill = (category: 'technical' | 'soft', name: string, level: number) => {
    setUserProfile((prev) => {
      const updatedSkills = {...prev.skills};
      updatedSkills[category].push({
        name,
        level,
        endorsements: 0
      });
      
      return {
        ...prev,
        skills: updatedSkills
      };
    });
    
    showNotification('Skill added successfully', 'success');
  };

  // Handle revoking a session
  const handleRevokeSession = (sessionId: string) => {
    setSecuritySettings((prev) => ({
      ...prev,
      sessions: prev.sessions.filter(session => session.id !== sessionId)
    }));
    
    showNotification('Session revoked successfully', 'success');
  };

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Load saved profile picture from localStorage
  useEffect(() => {
    const savedPicture = localStorage.getItem('profilePicture');
    if (savedPicture) {
      setUserProfile(prev => ({
        ...prev,
        profilePicture: savedPicture
      }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Sidebar />
      <div className="main-content p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfileCard 
            userProfile={userProfile}
            onProfilePictureUpdate={handleProfilePictureUpdate}
            onStatusChange={handleStatusChange}
            onEndorseSkill={handleEndorseSkill}
            onUpdateSkillLevel={handleUpdateSkillLevel}
            onAddSkill={handleAddSkill}
          />
          
          <SecuritySettings 
            securitySettings={securitySettings}
            onRevokeSession={handleRevokeSession}
            showNotification={showNotification}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 