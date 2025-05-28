import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { updateEmployeeProfilePicture } from '../../../services/employeeService';

interface ManagerInfo {
  name: string;
  position: string;
  id: string;
  email: string;
}

interface ProfileHeaderProps {
  name: string;
  role: string;
  employeeId: string;
  profilePicture: string;
  status: 'available' | 'away' | 'busy';
  department: string;
  manager?: ManagerInfo | null;
  onProfilePictureUpdate: (imageUrl: string) => void;
  onStatusChange: (status: 'available' | 'away' | 'busy') => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  role,
  employeeId,
  profilePicture,
  status,
  department,
  manager,
  onProfilePictureUpdate,
  onStatusChange
}) => {
  const { userEmail } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // Handle profile picture change
  const handleProfilePictureClick = () => {
    if (!userEmail) {
      alert('You must be logged in to update your profile picture');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB');
          return;
        }

        setIsUploading(true);

        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            if (e.target && typeof e.target.result === 'string') {
              const imageUrl = e.target.result;
              
              try {
                // Update in backend first
                await updateEmployeeProfilePicture(userEmail, imageUrl);
                
                // If backend update successful, update UI
                onProfilePictureUpdate(imageUrl);
              } catch (error) {
                console.error('Error updating profile picture:', error);
                alert('Failed to update profile picture. Please try again.');
              }
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error reading file:', error);
          alert('Failed to read image file. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
    };
    input.click();
  };

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'available' | 'away' | 'busy';
    onStatusChange(newStatus);
  };

  // Get status dot color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-400';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status emoji
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'available':
        return '🟢';
      case 'away':
        return '🟡';
      case 'busy':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="flex items-center gap-8 mb-8">
      <div className="profile-avatar">
        <img 
          src={profilePicture} 
          alt={name} 
          className="w-full h-full object-cover"
        />
        <div className={`status-dot ${getStatusColor(status)}`}></div>
        <button 
          className="camera-button"
          onClick={handleProfilePictureClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <i className="bi bi-arrow-clockwise animate-spin"></i>
          ) : (
            <i className="bi bi-camera"></i>
          )}
        </button>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-1">
          <h2 className="text-3xl font-bold text-gray-800">{name}</h2>
        </div>
        <p className="text-lg text-gray-600 mb-1">{role}</p>
        <p className="text-sm text-gray-500 mb-1">Employee ID: {employeeId}</p>
        <p className="text-sm text-gray-500 mb-1">Department: {department}</p>
        
        {manager && (
          <p className="text-sm text-gray-500 mb-3">
            Manager: {manager.name} ({manager.position})
          </p>
        )}
        
        <select 
          className="neo-input p-3 w-full text-gray-700"
          value={status}
          onChange={handleStatusChange}
        >
          <option value="available">{getStatusEmoji('available')} Available</option>
          <option value="away">{getStatusEmoji('away')} Away</option>
          <option value="busy">{getStatusEmoji('busy')} Busy</option>
        </select>
      </div>
    </div>
  );
};

export default ProfileHeader; 