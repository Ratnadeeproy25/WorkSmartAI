import React, { useState, useEffect, FormEvent } from 'react';
import { Manager, ManagerFormData, ValidationErrors } from './types';

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
    department: '',
    position: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isEdit && manager) {
      setFormData({
        id: manager.id,
        name: manager.name,
        department: manager.department,
        position: manager.position
      });
    } else {
      setFormData({
        id: '',
        name: '',
        department: '',
        position: ''
      });
    }
    setErrors({});
  }, [isEdit, manager, isOpen]);

  const validateManagerId = (id: string): boolean => {
    const regex = /^[A-Z]{2}[0-9]{4}$/;
    return regex.test(id);
  };

  const validateName = (name: string): boolean => {
    return name.length >= 2 && name.length <= 50;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id.replace('manager-', '')]: value
    });
    
    // Clear errors when field is changed
    if (id === 'manager-id' || id === 'manager-name') {
      setErrors({
        ...errors,
        [id]: undefined
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    let newErrors: ValidationErrors = {};
    let isValid = true;
    
    if (!validateManagerId(formData.id)) {
      newErrors.managerId = 'Manager ID must be 2 letters followed by 4 numbers';
      isValid = false;
    }
    
    if (!validateName(formData.name)) {
      newErrors.managerName = 'Name must be between 2 and 50 characters';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) return;
    
    onSave(formData, managerIndex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h3 id="modal-title" className="text-xl font-semibold mb-4">
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
              pattern="[A-Z]{2}[0-9]{4}" 
              title="Manager ID must be 2 letters followed by 4 numbers"
              value={formData.id}
              onChange={handleChange}
            />
            {errors.managerId && (
              <p className="text-red-500 text-sm">{errors.managerId}</p>
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
          <div className="flex justify-end space-x-2 mt-4">
            <button 
              type="button" 
              id="modal-cancel" 
              className="neo-button px-4"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="neo-button primary px-4">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerModal; 