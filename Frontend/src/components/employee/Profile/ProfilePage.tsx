import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import ProfileCard from './ProfileCard';
import SecuritySettings from './SecuritySettings';
import { UserProfile } from './types';
import Sidebar from '../Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { getEmployeeProfile } from '../../../services/employeeService';

const ProfilePage: React.FC = () => {
  const { userEmail, userName } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: userName || "Loading...",
    role: "Loading...",
    employeeId: "",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    status: "available",
    contactInfo: {
      email: userEmail || "",
      phone: "",
      location: ""
    },
    department: "Loading...",
    skills: {
      technical: [],
      soft: []
    },
    performanceData: [0, 0, 0, 0, 0, 0],
    timeline: []
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Get user-specific storage key for profile picture
  const getProfilePictureKey = (email: string) => `profilePicture_${email}`;

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userEmail) return;
      
      setIsLoading(true);
      try {
        const profileData = await getEmployeeProfile(userEmail);
        setUserProfile(prev => {
          const newProfileData = { ...prev, ...profileData };
          // Ensure profilePicture from localStorage is prioritized if available
          const storedProfilePicture = localStorage.getItem(getProfilePictureKey(userEmail));
          if (storedProfilePicture) {
            newProfileData.profilePicture = storedProfilePicture;
          } else if (profileData.profilePicture) {
            newProfileData.profilePicture = profileData.profilePicture;
          } else {
            newProfileData.profilePicture = prev.profilePicture; // Fallback to previous or initial if nothing new
          }
          return newProfileData;
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
        showNotification('Failed to load profile data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userEmail]);

  // Handle profile picture update
  const handleProfilePictureUpdate = (imageUrl: string) => {
    if (!userEmail) return;

    setUserProfile((prev) => ({
      ...prev,
      profilePicture: imageUrl
    }));
    
    // Store profile picture with user-specific key
    localStorage.setItem(getProfilePictureKey(userEmail), imageUrl);
    showNotification('Profile picture updated successfully', 'success');
  };

  // Handle status change
  const handleStatusChange = (status: 'available' | 'away' | 'busy') => {
    setUserProfile((prev) => ({
      ...prev,
      status
    }));
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

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Employee Profile</title>
      </Helmet>
      <div className="min-h-screen bg-[#e0e5ec]">
        <Sidebar />
        <div className="main-content p-6">
          {error && (
            <div className="max-w-7xl mx-auto mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
              <div className="neo-box p-8 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-700">Loading profile data...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex gap-4">
                <button 
                  className={`py-2 px-6 rounded-lg font-medium ${activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </button>
                <button 
                  className={`py-2 px-6 rounded-lg font-medium ${activeTab === 'security' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
              </div>

              {activeTab === 'profile' ? (
                <ProfileCard 
                  userProfile={userProfile}
                  onProfilePictureUpdate={handleProfilePictureUpdate}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <SecuritySettings 
                  showNotification={showNotification}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage; 