import React, { useState, useEffect } from 'react';
import { ValidationErrors, AdminFormData } from './types';
import { Admin, generateAdminId } from '../../../services/adminService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdminFormData, index?: number) => void;
  admin?: Admin;
  index?: number;
}

const AdminModal: React.FC<AdminModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  admin, 
  index 
}) => {
  const [formData, setFormData] = useState<AdminFormData>({
    id: '',
    name: '',
    email: '',
    password: '',
    accessLevel: 'Limited'
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resetForm = async () => {
      if (admin) {
        // Editing existing admin
        setFormData({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          password: '', // Don't populate password for security
          accessLevel: admin.accessLevel
        });
      } else {
        // Creating new admin
        setLoading(true);
        try {
          const newId = await generateAdminId();
          setFormData({
            id: newId,
            name: '',
            email: '',
            password: '',
            accessLevel: 'Limited'
          });
        } catch (err) {
          console.error('Error generating admin ID:', err);
        } finally {
          setLoading(false);
        }
      }
      setErrors({});
    };

    if (isOpen) {
      resetForm();
    }
  }, [isOpen, admin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is edited
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Validate admin ID
    if (!formData.id) {
      newErrors.adminId = 'Admin ID is required';
    }
    
    // Validate name
    if (!formData.name) {
      newErrors.adminName = 'Name is required';
    }
    
    // Validate email
    if (!formData.email) {
      newErrors.adminEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.adminEmail = 'Email is invalid';
    }
    
    // Validate password (only required for new admin)
    if (!admin && !formData.password) {
      newErrors.adminPassword = 'Password is required for new admins';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.adminPassword = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSave(formData, index);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="neo-box bg-white rounded-lg w-full max-w-xl mx-4 p-8 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <i className="bi bi-x-lg text-2xl"></i>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {admin ? 'Edit Admin' : 'Add New Admin'}
        </h2>
        
        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Admin ID */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin ID
                </label>
                <input
                  type="text"
                  name="id"
                  className={`neo-input w-full ${errors.adminId ? 'border-red-500' : ''}`}
                  value={formData.id}
                  onChange={handleChange}
                  readOnly={!!admin} // Make read-only when editing
                />
                {errors.adminId && (
                  <p className="text-red-500 text-xs mt-1">{errors.adminId}</p>
                )}
              </div>
              
              {/* Name */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  className={`neo-input w-full ${errors.adminName ? 'border-red-500' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.adminName && (
                  <p className="text-red-500 text-xs mt-1">{errors.adminName}</p>
                )}
              </div>
              
              {/* Email */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className={`neo-input w-full ${errors.adminEmail ? 'border-red-500' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.adminEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>
                )}
              </div>
              
              {/* Password */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {admin ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  name="password"
                  className={`neo-input w-full ${errors.adminPassword ? 'border-red-500' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.adminPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>
                )}
              </div>
              
              {/* Access Level */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level
                </label>
                <select
                  name="accessLevel"
                  className="neo-select w-full"
                  value={formData.accessLevel}
                  onChange={handleChange}
                >
                  <option value="Limited">Limited</option>
                  <option value="Full">Full</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="neo-button secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="neo-button primary"
              >
                {admin ? 'Update Admin' : 'Add Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminModal; 