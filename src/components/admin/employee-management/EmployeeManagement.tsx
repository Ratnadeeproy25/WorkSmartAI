import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '../dashboard';
import EmployeeTable from './EmployeeTable';
import EmployeeModal from './EmployeeModal';
import SearchAndFilters from './SearchAndFilters';
import { Employee, EmployeeFormData } from './types';

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

  // Load employees from localStorage on component mount
  useEffect(() => {
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees));
    } else {
      // Default employees if none exist in localStorage
      const defaultEmployees: Employee[] = [
        { id: 'EM001', name: 'John Doe', department: 'Development', position: 'Developer', status: 'Active' as 'Active' },
        { id: 'EM002', name: 'Jane Smith', department: 'Design', position: 'Designer', status: 'Inactive' as 'Inactive' }
      ];
      setEmployees(defaultEmployees);
      localStorage.setItem('employees', JSON.stringify(defaultEmployees));
    }
  }, []);

  // Update departments when employees change
  useEffect(() => {
    const uniqueDepartments = Array.from(new Set(employees.map(e => e.department)));
    setDepartments(uniqueDepartments);
  }, [employees]);

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
      const aValue = a[sortColumn as keyof Employee].toString().toLowerCase();
      const bValue = b[sortColumn as keyof Employee].toString().toLowerCase();
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

  const handleToggleStatus = (index: number) => {
    const updatedEmployees = [...employees];
    updatedEmployees[index].status = updatedEmployees[index].status === 'Active' ? 'Inactive' : 'Active';
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
  };

  const handleDeleteEmployee = (index: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      const updatedEmployees = [...employees];
      updatedEmployees.splice(index, 1);
      setEmployees(updatedEmployees);
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
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

  const generateEmployeeId = (): string => {
    const lastId = employees.length > 0 ? 
      parseInt(employees[employees.length - 1].id.substring(2)) : 0;
    return `EM${String(lastId + 1).padStart(3, '0')}`;
  };

  const isIdUnique = (id: string, excludeIndex?: number): boolean => {
    return !employees.some((emp, index) => 
      emp.id === id && (excludeIndex === undefined || index !== excludeIndex)
    );
  };

  const handleSaveEmployee = (data: EmployeeFormData, index?: number) => {
    // Check if ID is unique for new employees or edited employees with changed ID
    if (index === undefined) {
      // Adding new employee
      if (!isIdUnique(data.id)) {
        alert('This Employee ID is already in use.');
        return;
      }
      
      const newEmployee: Employee = {
        ...data,
        status: 'Active'
      };
      
      const updatedEmployees = [...employees, newEmployee];
      setEmployees(updatedEmployees);
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    } else {
      // Editing existing employee
      if (data.id !== employees[index].id && !isIdUnique(data.id, index)) {
        alert('This Employee ID is already in use.');
        return;
      }
      
      const updatedEmployees = [...employees];
      updatedEmployees[index] = {
        ...updatedEmployees[index],
        ...data
      };
      
      setEmployees(updatedEmployees);
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    }
    
    handleCloseModal();
  };

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
                  <button className="neo-button p-3">
                    <i className="bi bi-bell text-xl"></i>
                  </button>
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
              <EmployeeTable 
                employees={filteredEmployees}
                onEdit={handleEditEmployee}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteEmployee}
                onSort={handleSortTable}
              />
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