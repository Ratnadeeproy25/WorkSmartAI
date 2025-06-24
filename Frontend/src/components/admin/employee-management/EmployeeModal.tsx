import React, { useState, useEffect, FormEvent } from 'react';
import { Employee, EmployeeFormData, ValidationErrors } from './types';
import { generateEmployeeId, getAllCombinedDepartments } from '../../../services/employeeService';
import { getAllManagers } from '../../../services/managerService';

interface EmployeeModalProps {
  isOpen: boolean;
  isEdit: boolean;
  employee?: Employee;
  employeeIndex?: number;
  onClose: () => void;
  onSave: (data: EmployeeFormData, index?: number) => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  isEdit,
  employee,
  employeeIndex,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
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
      lng: 0,
      address: {
        city: '',
        state: '',
        country: ''
      }
    }
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [managers, setManagers] = useState<{ _id: string; name: string; department: string; position: string }[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<{ _id: string; name: string; department: string; position: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && employee) {
        setFormData({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          password: employee.password,
          department: employee.department,
          position: employee.position,
          shiftTime: employee.shiftTime || { start: '09:00', end: '17:00' },
          officeLocation: {
            lat: employee.officeLocation?.lat || 0,
            lng: employee.officeLocation?.lng || 0,
            address: {
              city: employee.officeLocation?.address?.city || '',
              state: employee.officeLocation?.address?.state || '',
              country: employee.officeLocation?.address?.country || ''
            }
          },
          manager: employee.manager
        });
      } else {
        // Reset form for new employee
        setFormData({
          id: '',
          name: '',
          email: '',
          password: '',
          department: '',
          position: '',
          shiftTime: { start: '09:00', end: '17:00' },
          officeLocation: { 
            lat: 0, 
            lng: 0, 
            address: { city: '', state: '', country: '' } 
          }
        });
        
        // Generate ID for new employee
        fetchEmployeeId();
      }
      setErrors({});
      
      // Fetch departments and managers for dropdowns
      fetchDepartmentsAndManagers();
    }
  }, [isEdit, employee, isOpen]);

  // Filter managers based on selected department
  useEffect(() => {
    if (formData.department) {
      const filtered = managers.filter(mgr => 
        mgr.department.toLowerCase() === formData.department.toLowerCase()
      );
      setFilteredManagers(filtered);
      
      // Reset manager selection if current manager is not in the new department
      if (formData.manager) {
        const isManagerInDepartment = filtered.some(mgr => mgr._id === formData.manager);
        if (!isManagerInDepartment) {
          setFormData(prev => ({ ...prev, manager: undefined }));
        }
      }
    } else {
      setFilteredManagers(managers);
    }
  }, [formData.department, managers]);

  const fetchDepartmentsAndManagers = async () => {
    try {
      const [departmentData, managerData] = await Promise.all([
        getAllCombinedDepartments(),
        getAllManagers()
      ]);
      
      setDepartments(departmentData);
      setManagers(managerData.map(m => ({ 
        _id: m._id, 
        name: m.name, 
        department: m.department, 
        position: m.position 
      })));
    } catch (error) {
      console.error('Error fetching departments and managers:', error);
    }
  };

  const fetchEmployeeId = async () => {
    if (!isEdit) {
      try {
        setIsLoading(true);
        const newId = await generateEmployeeId();
        setFormData(prev => ({ ...prev, id: newId }));
      } catch (err) {
        console.error('Error generating employee ID:', err);
        // Fallback to manual ID entry if API fails
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validateEmployeeId = (id: string): boolean => {
    // Matching the format used by the backend
    const regex = /^EM\d{3}$/;
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
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            officeLocation: {
              ...prev.officeLocation,
              lat: lat,
              lng: lng
            }
          }));
          
          // Try to get address from coordinates using reverse geocoding
          reverseGeocode(lat, lng);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Error getting your location. Please try again or enter the address manually.');
          setLocationLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using a free geocoding service (you can replace with your preferred service)
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await response.json();
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          officeLocation: {
            ...prev.officeLocation,
            address: {
              city: data.city || data.locality || '',
              state: data.principalSubdivision || '',
              country: data.countryName || ''
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Don't show error to user, just log it
    }
  };

  const geocodeAddress = async () => {
    const { city, state, country } = formData.officeLocation.address;
    if (!city || !country) {
      alert('Please enter at least city and country to get coordinates.');
      return;
    }

    setLocationLoading(true);
    try {
      const address = `${city}, ${state}, ${country}`.replace(', ,', ',');
      // Using a free geocoding service
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=YOUR_API_KEY&limit=1`);
      
      // Fallback to a free service that doesn't require API key
      const fallbackResponse = await fetch(`https://api.bigdatacloud.net/data/geocode?query=${encodeURIComponent(address)}&localityLanguage=en`);
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.results && data.results.length > 0) {
          const location = data.results[0];
          setFormData(prev => ({
            ...prev,
            officeLocation: {
              ...prev.officeLocation,
              lat: location.latitude || 0,
              lng: location.longitude || 0
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      alert('Error getting coordinates for the address. Please enter coordinates manually if needed.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id.startsWith('employee-shift-')) {
      const field = id.replace('employee-shift-', '');
      setFormData({
        ...formData,
        shiftTime: {
          ...formData.shiftTime,
          [field]: value
        }
      });
    } else if (id.startsWith('employee-office-')) {
      const field = id.replace('employee-office-', '');
      if (field === 'lat' || field === 'lng') {
        setFormData({
          ...formData,
          officeLocation: {
            ...formData.officeLocation,
            [field]: parseFloat(value) || 0
          }
        });
      } else {
        // Handle address fields
        setFormData({
          ...formData,
          officeLocation: {
            ...formData.officeLocation,
            address: {
              ...formData.officeLocation.address,
              [field]: value
            }
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [id.replace('employee-', '')]: value
      });
    }
    
    // Clear errors when field is changed
    if (id === 'employee-id' || id === 'employee-name' || id === 'employee-email' || id === 'employee-password') {
      setErrors({
        ...errors,
        [id]: undefined
      });
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData({ ...formData, department: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    let newErrors: ValidationErrors = {};
    let isValid = true;
    
    if (!validateEmployeeId(formData.id)) {
      newErrors.employeeId = 'Employee ID must be in format EM followed by 3 numbers (e.g., EM001)';
      isValid = false;
    }
    
    if (!validateName(formData.name)) {
      newErrors.employeeName = 'Name must be between 2 and 50 characters';
      isValid = false;
    }

    if (!validateEmail(formData.email)) {
      newErrors.employeeEmail = 'Please enter a valid email address';
      isValid = false;
    }

    if (!validatePassword(formData.password)) {
      newErrors.employeePassword = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) return;
    
    onSave(formData, employeeIndex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
        <h3 id="modal-title" className="text-xl font-semibold mb-4 sticky top-0 bg-white pb-2">
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </h3>
        <form id="employee-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700">Employee ID</label>
            <input 
              type="text" 
              id="employee-id" 
              className="w-full p-2 border rounded" 
              required 
              pattern="EM\d{3}" 
              title="Employee ID must be in format EM followed by 3 numbers (e.g., EM001)"
              value={formData.id}
              onChange={handleChange}
              disabled={isLoading || (!isEdit && formData.id !== '')}
            />
            {errors.employeeId && (
              <p className="text-red-500 text-sm">{errors.employeeId}</p>
            )}
            {isLoading && (
              <p className="text-gray-500 text-sm">Generating employee ID...</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Name</label>
            <input 
              type="text" 
              id="employee-name" 
              className="w-full p-2 border rounded" 
              required 
              minLength={2} 
              maxLength={50}
              value={formData.name}
              onChange={handleChange}
            />
            {errors.employeeName && (
              <p className="text-red-500 text-sm">{errors.employeeName}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input 
              type="email" 
              id="employee-email" 
              className="w-full p-2 border rounded" 
              required
              value={formData.email}
              onChange={handleChange}
            />
            {errors.employeeEmail && (
              <p className="text-red-500 text-sm">{errors.employeeEmail}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="employee-password" 
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
            {errors.employeePassword && (
              <p className="text-red-500 text-sm">{errors.employeePassword}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Department</label>
            <select 
              id="employee-department" 
              className="w-full p-2 border rounded" 
              required
              value={formData.department}
              onChange={handleDepartmentChange}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Position</label>
            <input 
              type="text" 
              id="employee-position" 
              className="w-full p-2 border rounded" 
              required
              value={formData.position}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-gray-700">Manager</label>
            <select
              id="employee-manager"
              className="w-full p-2 border rounded"
              value={formData.manager || ''}
              onChange={e => setFormData({ ...formData, manager: e.target.value })}
              disabled={!formData.department}
            >
              <option value="">
                {!formData.department ? 'Select department first' : 'Select Manager (Optional)'}
              </option>
              {filteredManagers.map(mgr => (
                <option key={mgr._id} value={mgr._id}>
                  {mgr.name} ({mgr.position})
                </option>
              ))}
            </select>
            {formData.department && filteredManagers.length === 0 && (
              <p className="text-amber-600 text-sm mt-1">
                No managers found in {formData.department} department
              </p>
            )}
          </div>
          
          {/* Shift Time Section */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-semibold mb-2">Shift Time</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Start Time</label>
                <input 
                  type="time" 
                  id="employee-shift-start" 
                  className="w-full p-2 border rounded" 
                  value={formData.shiftTime.start}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-gray-700">End Time</label>
                <input 
                  type="time" 
                  id="employee-shift-end" 
                  className="w-full p-2 border rounded" 
                  value={formData.shiftTime.end}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Office Location Section - For Attendance Tracking */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-semibold mb-2">Office Location</h4>
            <p className="text-sm text-gray-500 mb-3">Enter your office address for attendance tracking</p>
            
            {/* Address Fields */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium">City</label>
                  <input 
                    type="text" 
                    id="employee-office-city" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Enter city"
                    value={formData.officeLocation.address.city}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium">State/Province</label>
                  <input 
                    type="text" 
                    id="employee-office-state" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Enter state"
                    value={formData.officeLocation.address.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium">Country</label>
                <input 
                  type="text" 
                  id="employee-office-country" 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter country"
                  value={formData.officeLocation.address.country}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                type="button" 
                className="neo-button secondary text-sm py-2"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                <i className="bi bi-geo-alt mr-1"></i>
                {locationLoading ? 'Getting Location...' : 'Auto-detect Location'}
              </button>
              <button 
                type="button" 
                className="neo-button secondary text-sm py-2"
                onClick={geocodeAddress}
                disabled={locationLoading || !formData.officeLocation.address.city || !formData.officeLocation.address.country}
              >
                <i className="bi bi-search mr-1"></i>
                Get Coordinates
              </button>
            </div>

            {/* Coordinates Display/Input */}
            <div className="bg-gray-50 p-3 rounded border">
              <label className="block text-gray-600 text-sm font-medium mb-2">
                <i className="bi bi-crosshair mr-1"></i>
                Coordinates (for precise attendance tracking)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 text-xs">Latitude</label>
                  <input 
                    type="number" 
                    id="employee-office-lat" 
                    className="w-full p-2 border rounded text-sm" 
                    step="any"
                    placeholder="0.0000"
                    value={formData.officeLocation.lat || ''}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs">Longitude</label>
                  <input 
                    type="number" 
                    id="employee-office-lng" 
                    className="w-full p-2 border rounded text-sm" 
                    step="any"
                    placeholder="0.0000"
                    value={formData.officeLocation.lng || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              {(formData.officeLocation.lat !== 0 || formData.officeLocation.lng !== 0) && (
                <p className="text-xs text-green-600 mt-1">
                  <i className="bi bi-check-circle mr-1"></i>
                  Coordinates set for attendance tracking
                </p>
              )}
            </div>

            {locationLoading && (
              <div className="text-center mt-2">
                <p className="text-gray-500 text-sm">
                  <i className="bi bi-arrow-clockwise spin mr-1"></i>
                  Processing location...
                </p>
              </div>
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

export default EmployeeModal; 