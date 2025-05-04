import React, { useState, useEffect, FormEvent } from 'react';
import { Employee, EmployeeFormData, ValidationErrors } from './types';

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
    department: '',
    position: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isEdit && employee) {
      setFormData({
        id: employee.id,
        name: employee.name,
        department: employee.department,
        position: employee.position
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
  }, [isEdit, employee, isOpen]);

  const validateEmployeeId = (id: string): boolean => {
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
      [id.replace('employee-', '')]: value
    });
    
    // Clear errors when field is changed
    if (id === 'employee-id' || id === 'employee-name') {
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
    
    if (!validateEmployeeId(formData.id)) {
      newErrors.employeeId = 'Employee ID must be 2 letters followed by 4 numbers';
      isValid = false;
    }
    
    if (!validateName(formData.name)) {
      newErrors.employeeName = 'Name must be between 2 and 50 characters';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) return;
    
    onSave(formData, employeeIndex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h3 id="modal-title" className="text-xl font-semibold mb-4">
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
              pattern="[A-Z]{2}[0-9]{4}" 
              title="Employee ID must be 2 letters followed by 4 numbers"
              value={formData.id}
              onChange={handleChange}
            />
            {errors.employeeId && (
              <p className="text-red-500 text-sm">{errors.employeeId}</p>
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
            <label className="block text-gray-700">Department</label>
            <input 
              type="text" 
              id="employee-department" 
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
              id="employee-position" 
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

export default EmployeeModal; 