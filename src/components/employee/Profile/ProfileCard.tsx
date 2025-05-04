import React, { useRef, useEffect } from 'react';
import { UserProfile } from './types';
import Chart from 'chart.js/auto';
import ProfileHeader from './ProfileHeader';
import ContactInfo from './ContactInfo';
import SkillsSection from './SkillsSection';
import Timeline from './Timeline';
import '../../../styles/employee/profile.css';

interface ProfileCardProps {
  userProfile: UserProfile;
  onProfilePictureUpdate: (imageUrl: string) => void;
  onStatusChange: (status: 'available' | 'away' | 'busy') => void;
  onEndorseSkill: (category: 'technical' | 'soft', skillName: string) => void;
  onUpdateSkillLevel: (category: 'technical' | 'soft', skillName: string, newLevel: number) => void;
  onAddSkill: (category: 'technical' | 'soft', name: string, level: number) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userProfile,
  onProfilePictureUpdate,
  onStatusChange,
  onEndorseSkill,
  onUpdateSkillLevel,
  onAddSkill
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Create performance chart
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Destroy existing chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Performance Score',
              data: userProfile.performanceData,
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
    
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [userProfile.performanceData]);

  return (
    <div className="neo-container p-8">
      <ProfileHeader 
        name={userProfile.name}
        role={userProfile.role}
        employeeId={userProfile.employeeId}
        profilePicture={userProfile.profilePicture}
        status={userProfile.status}
        onProfilePictureUpdate={onProfilePictureUpdate}
        onStatusChange={onStatusChange}
      />

      <ContactInfo contactInfo={userProfile.contactInfo} />

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance</h3>
        <canvas ref={chartRef} className="w-full h-48"></canvas>
      </div>

      <SkillsSection 
        skills={userProfile.skills}
        onEndorseSkill={onEndorseSkill}
        onUpdateSkillLevel={onUpdateSkillLevel}
        onAddSkill={onAddSkill}
      />

      <Timeline items={userProfile.timeline} />
    </div>
  );
};

export default ProfileCard; 