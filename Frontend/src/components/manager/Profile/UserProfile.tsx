import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getManagerProfile, updateManagerContactInfo, updateManagerProfilePicture } from '../../../services/managerService';

interface ManagerProfileData {
  name: string;
  role: string;
  employeeId: string;
  profilePicture: string;
  status: 'available' | 'away' | 'busy';
  contactInfo: {
    email: string;
    phone: string;
    location: string;
    teamSize: string;
  };
  department: string;
}

const UserProfile: React.FC = () => {
  const { userName, userEmail } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ManagerProfileData>({
    name: userName || 'Loading...',
    role: 'Loading...',
    employeeId: '',
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    status: 'available',
    contactInfo: {
      email: userEmail || '',
      phone: '',
      location: '',
      teamSize: '0 Members'
    },
    department: 'Loading...'
  });

  // Contact form states
  const [phone, setPhone] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  // Get user-specific storage key for profile picture
  const getProfilePictureKey = (email: string) => `managerProfilePicture_${email}`;

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userEmail) return;
      
      setIsLoading(true);
      try {
        const data = await getManagerProfile(userEmail);
        
        // Set profile data
        setProfileData(prev => {
          // Ensure status is one of the allowed values
          const statusValue = ['available', 'away', 'busy'].includes(data.status) 
            ? (data.status as 'available' | 'away' | 'busy') 
            : 'available';
            
          const newProfileData = { 
            ...prev, 
            ...data,
            status: statusValue
          };
          
          // Set form values
          setPhone(data.contactInfo.phone);
          setLocation(data.contactInfo.location);
          
          // Check for cached profile picture
          const cachedProfilePicture = localStorage.getItem(getProfilePictureKey(userEmail));
          if (cachedProfilePicture) {
            newProfileData.profilePicture = cachedProfilePicture;
          }
          
          return newProfileData;
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userEmail]);

  // Handle profile picture update
  const handleProfilePictureClick = () => {
    if (!userEmail) {
      console.error('UserProfile: userEmail is not available for profile picture update.');
      showNotification('You must be logged in to update your profile picture', 'error');
      return;
    }
    console.log(`UserProfile: Initiating profile picture update for email: ${userEmail}`);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        console.log('UserProfile: File selected:', file.name, file.size, file.type);
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.warn('UserProfile: File size exceeds 5MB limit.');
          showNotification('Image size should be less than 5MB', 'error');
          return;
        }

        setIsUploading(true);
        console.log('UserProfile: Started uploading...');

        try {
          // Use canvas to resize the image before uploading
          const resizedImage = await resizeImage(file, 800); // Max width 800px
          console.log('UserProfile: Image resized successfully');
          
          try {
            console.log(`UserProfile: Calling updateManagerProfilePicture API for email: ${userEmail}`);
            // Update in backend first
            const result = await updateManagerProfilePicture(userEmail, resizedImage);
            console.log('UserProfile: API response received:', result);
            
            // Update local state and storage only after successful backend update
            if (result && result.profilePicture) {
              console.log('UserProfile: Backend update successful. New picture URL:', result.profilePicture);
              setProfileData(prev => ({
                ...prev,
                profilePicture: result.profilePicture
              }));
              
              // Store with manager-specific key
              const storageKey = getProfilePictureKey(userEmail);
              localStorage.setItem(storageKey, result.profilePicture);
              console.log(`UserProfile: Profile picture updated in localStorage with key: ${storageKey}`);
              
              showNotification('Profile picture updated successfully', 'success');
            } else {
              console.error('UserProfile: Invalid response from server or missing profilePicture in response:', result);
              throw new Error('Invalid response from server');
            }
          } catch (error: any) {
            console.error('UserProfile: Error updating profile picture via API:', error);
            showNotification(error.message || 'Failed to update profile picture', 'error');
          } finally {
            setIsUploading(false);
            console.log('UserProfile: Uploading finished (API call attempt).');
          }
        } catch (error) {
          console.error('UserProfile: Error processing image:', error);
          showNotification('Failed to process image file', 'error');
          setIsUploading(false);
        }
      } else {
        console.log('UserProfile: No file selected or files array is empty.');
      }
    };
    input.click();
  };

  // Function to resize image using canvas
  const resizeImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        const img = new Image();
        img.src = event.target.result as string;
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Draw image to canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to data URL with reduced quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG
          
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Handle contact info edit
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle contact form submission
  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail) {
      showNotification('You must be logged in to update your contact info', 'error');
      return;
    }
    
    try {
      const result = await updateManagerContactInfo(userEmail, phone, location);
      
      // Update profile data with response
      setProfileData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          ...result.contactInfo
        }
      }));
      
      setIsEditing(false);
      showNotification('Contact information updated successfully', 'success');
    } catch (error) {
      console.error('Error updating contact info:', error);
      showNotification('Failed to update contact information', 'error');
    }
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

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'available' | 'away' | 'busy';
    setProfileData(prev => ({
      ...prev,
      status: newStatus
    }));
  };

  if (isLoading) {
    return (
      <div className="neo-box p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neo-box p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-box p-8">
      {/* User Profile Header */}
      <div className="flex items-center gap-8 mb-8">
        <div className="profile-avatar">
          <img 
            src={profileData.profilePicture} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
          <div className="status-dot bg-green-500"></div>
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
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-gray-800">{profileData.name}</h2>
            <button 
              className="neo-button p-2"
              onClick={handleEditClick}
            >
              <i className="bi bi-pencil"></i>
            </button>
          </div>
          <p className="text-lg text-gray-600 mb-2">{profileData.role}</p>
          <p className="text-sm text-gray-500 mb-1">Manager ID: {profileData.employeeId}</p>
          <p className="text-sm text-gray-500 mb-4">Department: {profileData.department}</p>
          <select 
            className="neo-input p-3 w-full text-gray-700"
            value={profileData.status}
            onChange={handleStatusChange}
          >
            <option value="available">🟢 Available for Meetings</option>
            <option value="away">🟡 In a Meeting</option>
            <option value="busy">🔴 Focus Time</option>
          </select>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
        
        {isEditing ? (
          <form onSubmit={handleContactFormSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="neo-input p-3 w-full" 
                value={profileData.contactInfo.email} 
                disabled 
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Phone</label>
              <input 
                type="text" 
                className="neo-input p-3 w-full" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Location</label>
              <input 
                type="text" 
                className="neo-input p-3 w-full" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Your location"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="neo-button primary p-3">Save Changes</button>
              <button 
                type="button" 
                className="neo-button p-3"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
        <div className="space-y-3">
          <div className="contact-info-item">
            <i className="bi bi-envelope text-blue-500"></i>
              <span className="text-gray-700">{profileData.contactInfo.email}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-telephone text-green-500"></i>
              <span className="text-gray-700">{profileData.contactInfo.phone || "Not specified"}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-geo-alt text-red-500"></i>
              <span className="text-gray-700">{profileData.contactInfo.location || "Not specified"}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-people text-purple-500"></i>
              <span className="text-gray-700">Team Size: {profileData.contactInfo.teamSize}</span>
            </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 