import React from 'react';
import { UserProfile } from './types';
import ProfileHeader from './ProfileHeader';
import ContactInfo from './ContactInfo';
import '../../../styles/employee/profile.css';

interface ProfileCardProps {
  userProfile: UserProfile;
  onProfilePictureUpdate: (imageUrl: string) => void;
  onStatusChange: (status: 'available' | 'away' | 'busy') => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userProfile,
  onProfilePictureUpdate,
  onStatusChange
}) => {
  return (
    <div className="neo-container p-8">
      <ProfileHeader 
        name={userProfile.name}
        role={userProfile.role}
        employeeId={userProfile.employeeId}
        profilePicture={userProfile.profilePicture}
        status={userProfile.status}
        department={userProfile.department}
        manager={userProfile.manager}
        onProfilePictureUpdate={onProfilePictureUpdate}
        onStatusChange={onStatusChange}
      />

      <ContactInfo contactInfo={userProfile.contactInfo} />
    </div>
  );
};

export default ProfileCard; 