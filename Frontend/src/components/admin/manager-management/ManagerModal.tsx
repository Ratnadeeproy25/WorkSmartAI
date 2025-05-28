import React, { useState, useEffect, FormEvent } from 'react';
import { Manager, ManagerFormData, ValidationErrors } from './types';
import { generateManagerId } from '../../../services/managerService';

interface ManagerModalProps {
  isOpen: boolean;
  isEdit: boolean;
  manager?: Manager;
  managerIndex?: number;
  onClose: () => void;
  onSave: (data: ManagerFormData, index?: number) => void;
}

const ManagerModal: React.FC<ManagerModalProps> = ({
  isOpen,
  isEdit,
  manager,
  managerIndex,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<ManagerFormData>({
    id: '',
    name: '',
    email: '',
    password: '',
    department: '',
    position: '',
    shiftTime: {
      start: '09:00',
      end: '17:00'
    },
    officeLocation: {
      lat: 0,
      lng: 0
    }
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && manager) {
        setFormData({
          id: manager.id,
          name: manager.name,
          email: manager.email,
          password: manager.password,
          department: manager.department,
          position: manager.position,
          shiftTime: manager.shiftTime || { start: '09:00', end: '17:00' },
          officeLocation: manager.officeLocation || { lat: 0, lng: 0 }
        });
      } else {
        // Reset form for new manager
        setFormData({
          id: '',
          name: '',
          email: '',
          password: '',
          department: '',
          position: '',
          shiftTime: { start: '09:00', end: '17:00' },
          officeLocation: { lat: 0, lng: 0 }
        });
        
        // Generate ID for new manager
        fetchManagerId();
      }
      setErrors({});
    }
  }, [isEdit, manager, isOpen]);

  const fetchManagerId = async () => {
    if (!isEdit) {
      try {
        setIsLoading(true);
        const newId = await generateManagerId();
        setFormData(prev => ({ ...prev, id: newId }));
      } catch (err) {
        console.error('Error generating manager ID:', err);
        // Fallback to manual ID entry if API fails
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validateManagerId = (id: string): boolean => {
    // Matching the format used by the backend
    const regex = /^MG\d{3}$/;
    return regex.test(id);
  };

  const validateName = (name: string): boolean => {
    return name.length >= 2 && name.length <= 50;
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            officeLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Error getting your location. Please try again or enter coordinates manually.');
          setLocationLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id.startsWith('manager-shift-')) {
      const field = id.replace('manager-shift-', '');
      setFormData({
        ...formData,
        shiftTime: {
          ...formData.shiftTime,
          [field]: value
        }
      });
    } else if (id.startsWith('manager-office-')) {
      const field = id.replace('manager-office-', '');
      setFormData({
        ...formData,
        officeLocation: {
          ...formData.officeLocation,
          [field]: parseFloat(value) || 0
        }
      });
    } else {
      setFormData({
        ...formData,
        [id.replace('manager-', '')]: value
      });
    }
    
    // Clear errors when field is changed
    if (id === 'manager-id' || id === 'manager-name' || id === 'manager-email' || id === 'manager-password') {
      setErrors({
        ...errors,
        [id]: undefined
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    let newErrors: ValidationErrors = {};
    let isValid = true;
    
    if (!validateManagerId(formData.id)) {
      newErrors.managerId = 'Manager ID must be in format MG followed by 3 numbers (e.g., MG001)';
      isValid = false;
    }
    
    if (!validateName(formData.name)) {
      newErrors.managerName = 'Name must be between 2 and 50 characters';
      isValid = false;
    }

    if (!validateEmail(formData.email)) {
      newErrors.managerEmail = 'Please enter a valid email address';
      isValid = false;
    }

    if (!validatePassword(formData.password)) {
      newErrors.managerPassword = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) return;
    
    onSave(formData, managerIndex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
        <h3 id="modal-title" className="text-xl font-semibold mb-4 sticky top-0 bg-white pb-2">
          {isEdit ? 'Edit Manager' : 'Add Manager'}
        </h3>
        <form id="manager-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700">Manager ID</label>
            <input 
              type="text" 
              id="manager-id" 
              className="w-full p-2 border rounded" 
              required 
              pattern="MG\d{3}" 
              title="Manager ID must be in format MG followed by 3 numbers (e.g., MG001)"
              value={formData.id}
              onChange={handleChange}
              disabled={isLoading || (!isEdit && formData.id !== '')}
            />
            {errors.managerId && (
              <p className="text-red-500 text-sm">{errors.managerId}</p>
            )}
            {isLoading && (
              <p className="text-gray-500 text-sm">Generating manager ID...</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Name</label>
            <input 
              type="text" 
              id="manager-name" 
              className="w-full p-2 border rounded" 
              required 
              minLength={2} 
              maxLength={50}
              value={formData.name}
              onChange={handleChange}
            />
            {errors.managerName && (
              <p className="text-red-500 text-sm">{errors.managerName}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input 
              type="email" 
              id="manager-email" 
              className="w-full p-2 border rounded" 
              required
              value={formData.email}
              onChange={handleChange}
            />
            {errors.managerEmail && (
              <p className="text-red-500 text-sm">{errors.managerEmail}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="manager-password" 
                className="w-full p-2 border rounded" 
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
              />
              <button 
                type="button" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={togglePasswordVisibility}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
            {errors.managerPassword && (
              <p className="text-red-500 text-sm">{errors.managerPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Department</label>
            <input 
              type="text" 
              id="manager-department" 
              className="w-full p-2 border rounded" 
              required
              value={formData.department}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-gray-700">Position</label>
            <input 
              type="text" 
              id="manager-position" 
              className="w-full p-2 border rounded" 
              required
              value={formData.position}
              onChange={handleChange}
            />
          </div>
          
          {/* Shift Time Section */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-semibold mb-2">Shift Time</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Start Time</label>
                <input 
                  type="time" 
                  id="manager-shift-start" 
                  className="w-full p-2 border rounded" 
                  value={formData.shiftTime.start}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-gray-700">End Time</label>
                <input 
                  type="time" 
                  id="manager-shift-end" 
                  className="w-full p-2 border rounded" 
                  value={formData.shiftTime.end}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Office Coordinates Section - For Attendance Tracking */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-semibold mb-2">Office Location Coordinates</h4>
            <p className="text-sm text-gray-500 mb-2">These coordinates will be used for attendance tracking</p>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-gray-700">Latitude</label>
                <input 
                  type="number" 
                  id="manager-office-lat" 
                  className="w-full p-2 border rounded" 
                  step="any"
                  value={formData.officeLocation.lat}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-gray-700">Longitude</label>
                <input 
                  type="number" 
                  id="manager-office-lng" 
                  className="w-full p-2 border rounded" 
                  step="any"
                  value={formData.officeLocation.lng}
                  onChange={handleChange}
                />
              </div>
            </div>
            <button 
              type="button" 
              className="neo-button secondary w-full mt-2"
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? 'Getting Location...' : 'Get Current Location'}
            </button>
            {locationLoading && (
              <p className="text-gray-500 text-sm mt-1">Fetching your current location...</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4 sticky bottom-0 pt-2 bg-white">
            <button 
              type="button" 
              id="modal-cancel" 
              className="neo-button px-4"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="neo-button primary px-4" 
              disabled={isLoading || locationLoading}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerModal;