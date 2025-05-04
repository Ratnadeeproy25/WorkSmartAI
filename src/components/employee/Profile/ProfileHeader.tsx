import React from 'react';

interface ProfileHeaderProps {
  name: string;
  role: string;
  employeeId: string;
  profilePicture: string;
  status: 'available' | 'away' | 'busy';
  onProfilePictureUpdate: (imageUrl: string) => void;
  onStatusChange: (status: 'available' | 'away' | 'busy') => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  role,
  employeeId,
  profilePicture,
  status,
  onProfilePictureUpdate,
  onStatusChange
}) => {
  // Handle profile picture change
  const handleProfilePictureClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            onProfilePictureUpdate(e.target.result);
          }
        };
        reader.readAsDataURL(file);
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
        >
          <i className="bi bi-camera"></i>
        </button>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-3xl font-bold text-gray-800">{name}</h2>
          <button className="neo-button p-2">
            <i className="bi bi-pencil"></i>
          </button>
        </div>
        <p className="text-lg text-gray-600 mb-2">{role}</p>
        <p className="text-sm text-gray-500 mb-4">Employee ID: {employeeId}</p>
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