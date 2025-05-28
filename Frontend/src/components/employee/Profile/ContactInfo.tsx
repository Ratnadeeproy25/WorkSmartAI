import React, { useState } from 'react';
import { ContactInfo as ContactInfoType } from './types';
import { useAuth } from '../../../context/AuthContext';
import { updateEmployeeContactInfo } from '../../../services/employeeService';

interface ContactInfoProps {
  contactInfo: ContactInfoType;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ contactInfo }) => {
  const { userEmail } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedContactInfo, setEditedContactInfo] = useState<ContactInfoType>(contactInfo);

  const handleEdit = () => {
    setEditedContactInfo(contactInfo);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    
    setIsLoading(true);
    try {
      await updateEmployeeContactInfo(
        userEmail,
        editedContactInfo.phone,
        editedContactInfo.location
      );
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-green-500 text-white z-50';
      notification.textContent = 'Contact information updated successfully';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating contact info:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-red-500 text-white z-50';
      notification.textContent = 'Failed to update contact information';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
        {!isEditing && (
          <button 
            className="neo-button px-4 py-2 text-sm font-medium"
            onClick={handleEdit}
          >
            <i className="bi bi-pencil mr-1"></i> Edit
          </button>
        )}
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="contact-info-item">
            <i className="bi bi-envelope text-blue-500"></i>
            <input
              type="text"
              className="neo-input p-2 w-full"
              value={editedContactInfo.email}
              disabled
            />
          </div>
          <div className="contact-info-item">
            <i className="bi bi-telephone text-green-500"></i>
            <input
              type="text"
              name="phone"
              className="neo-input p-2 w-full"
              placeholder="Phone number"
              value={editedContactInfo.phone}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="contact-info-item">
            <i className="bi bi-geo-alt text-red-500"></i>
            <input
              type="text"
              name="location"
              className="neo-input p-2 w-full"
              placeholder="Location"
              value={editedContactInfo.location}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="neo-button primary px-4 py-2 text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="neo-button px-4 py-2 text-sm font-medium"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="contact-info-item">
            <i className="bi bi-envelope text-blue-500"></i>
            <span className="text-gray-700">{contactInfo.email}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-telephone text-green-500"></i>
            <span className="text-gray-700">{contactInfo.phone || 'Not provided'}</span>
          </div>
          <div className="contact-info-item">
            <i className="bi bi-geo-alt text-red-500"></i>
            <span className="text-gray-700">{contactInfo.location || 'Not provided'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfo; 