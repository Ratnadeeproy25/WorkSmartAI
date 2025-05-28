import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '../dashboard';
import EmployeeTable from './EmployeeTable';
import EmployeeModal from './EmployeeModal';
import SearchAndFilters from './SearchAndFilters';
import { Employee, EmployeeFormData } from './types';
import { 
  getAllEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  toggleEmployeeStatus,
  getAllDepartments,
  generateEmployeeId
} from '../../../services/employeeService';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editIndex, setEditIndex] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load employees from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const employeeData = await getAllEmployees();
        setEmployees(employeeData);
        
        const departmentData = await getAllDepartments();
        setDepartments(departmentData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load employees. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter employees when search query, department filter, or employees change
  useEffect(() => {
    let filtered = [...employees];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(emp => 
        emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply department filter
    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(e => e.department === selectedDepartment);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      // Handle nested properties like shiftTime and workLocation
      const getSortValue = (employee: Employee, key: string) => {
        // Check if the key contains a period (e.g., 'shiftTime.start')
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          const parentObj = employee[parent as keyof Employee];
          // Return empty string if the parent object is undefined
          if (!parentObj || typeof parentObj !== 'object') {
            return '';
          }
          // Return the child property or empty string if undefined
          return (parentObj as any)[child]?.toString().toLowerCase() || '';
        }

        // Handle basic properties with undefined check
        const value = employee[key as keyof Employee];
        if (value === undefined || value === null) {
          return '';
        }
        
        // Handle objects - convert to string representation
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase();
        }
        
        return value.toString().toLowerCase();
      };

      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);
      
      return sortDirection === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue);
    });
    
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, searchQuery, selectedDepartment, sortColumn, sortDirection]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };

  const handleSortTable = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleEditEmployee = (index: number) => {
    setIsEdit(true);
    setEditIndex(index);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (index: number) => {
    try {
      const employeeId = employees[index].id;
      const updatedEmployee = await toggleEmployeeStatus(employeeId);
      
      // Update local state
      const updatedEmployees = [...employees];
      updatedEmployees[index] = updatedEmployee;
      setEmployees(updatedEmployees);
    } catch (err) {
      console.error('Error toggling employee status:', err);
      alert('Failed to update employee status. Please try again.');
    }
  };

  const handleDeleteEmployee = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const employeeId = employees[index].id;
        await deleteEmployee(employeeId);
        
        // Update local state
        const updatedEmployees = [...employees];
        updatedEmployees.splice(index, 1);
        setEmployees(updatedEmployees);
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert('Failed to delete employee. Please try again.');
      }
    }
  };

  const handleAddEmployee = () => {
    setIsEdit(false);
    setEditIndex(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const isIdUnique = (id: string, excludeIndex?: number): boolean => {
    return !employees.some((emp, index) => 
      emp.id === id && (excludeIndex === undefined || index !== excludeIndex)
    );
  };

  const handleSaveEmployee = async (data: EmployeeFormData, index?: number) => {
    try {
      if (index === undefined) {
        // Adding new employee
        if (!isIdUnique(data.id)) {
          alert('This Employee ID is already in use.');
          return;
        }
        
        const newEmployee = await createEmployee(data);
        setEmployees([...employees, newEmployee]);
      } else {
        // Editing existing employee
        if (data.id !== employees[index].id && !isIdUnique(data.id, index)) {
          alert('This Employee ID is already in use.');
          return;
        }
        
        const updatedEmployee = await updateEmployee(employees[index].id, data);
        
        // Update local state
        const updatedEmployees = [...employees];
        updatedEmployees[index] = updatedEmployee;
        setEmployees(updatedEmployees);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('Error saving employee:', err);
      alert('Failed to save employee data. Please try again.');
    }
  };

  // For simple loading indicator
  if (isLoading && employees.length === 0) {
    return <div className="flex min-h-screen bg-[#e0e5ec] justify-center items-center">
      <p className="text-xl">Loading employee data...</p>
    </div>;
  }

  return (
    <>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" />
        <style>{`
          * {
            font-family: 'Poppins', sans-serif;
          }
        `}</style>
      </Helmet>

      <div className="flex min-h-screen bg-[#e0e5ec]">
        <AdminSidebar />

        <div className="main-content flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="neo-box p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Employee Management</h1>
                  <p className="text-lg text-gray-600">Manage employee records and performance</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    id="add-employee-btn" 
                    className="neo-button primary p-3"
                    onClick={handleAddEmployee}
                  >
                    <i className="bi bi-plus-lg mr-2"></i>Add Employee
                  </button>
                </div>
              </div>
            </div>

            {/* Error message if any */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <p>{error}</p>
              </div>
            )}

            {/* Search and Filters */}
            <SearchAndFilters 
              searchValue={searchQuery}
              onSearchChange={handleSearchChange}
              departments={departments}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={handleDepartmentChange}
            />

            {/* Employee List */}
            <div className="neo-box p-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Employee List</h2>
              {employees.length === 0 && !isLoading ? (
                <p className="text-center py-4">No employees found. Add your first employee!</p>
              ) : (
                <EmployeeTable 
                  employees={filteredEmployees}
                  onEdit={handleEditEmployee}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteEmployee}
                  onSort={handleSortTable}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={isModalOpen}
        isEdit={isEdit}
        employee={isEdit && editIndex !== undefined ? employees[editIndex] : undefined}
        employeeIndex={editIndex}
        onClose={handleCloseModal}
        onSave={handleSaveEmployee}
      />
    </>
  );
};

export default EmployeeManagement; 