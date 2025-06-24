import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '../dashboard';
import ManagerTable from './ManagerTable';
import ManagerModal from './ManagerModal';
import SearchAndFilters from './SearchAndFilters';
import { Manager, ManagerFormData } from './types';
import { 
  getAllManagers, 
  createManager, 
  updateManager, 
  deleteManager, 
  toggleManagerStatus,
  getAllDepartments,
  generateManagerId
} from '../../../services/managerService';

const ManagerManagement: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
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

  // Load managers from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const managerData = await getAllManagers();
        setManagers(managerData);
        
        const departmentData = await getAllDepartments();
        setDepartments(departmentData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load managers. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter managers when search query, department filter, or managers change
  useEffect(() => {
    let filtered = [...managers];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(mgr => 
        mgr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mgr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mgr.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mgr.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply department filter
    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(m => m.department === selectedDepartment);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      // Handle nested properties like shiftTime and workLocation
      const getSortValue = (manager: Manager, key: string) => {
        // Check if the key contains a period (e.g., 'shiftTime.start')
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          const parentObj = manager[parent as keyof Manager];
          // Return empty string if the parent object is undefined
          if (!parentObj || typeof parentObj !== 'object') {
            return '';
          }
          // Return the child property or empty string if undefined
          return (parentObj as any)[child]?.toString().toLowerCase() || '';
        }

        // Handle basic properties with undefined check
        const value = manager[key as keyof Manager];
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
    
    setFilteredManagers(filtered);
    setCurrentPage(1);
  }, [managers, searchQuery, selectedDepartment, sortColumn, sortDirection]);

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

  const handleEditManager = (index: number) => {
    setIsEdit(true);
    setEditIndex(index);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (index: number) => {
    try {
      const managerId = managers[index].id;
      const updatedManager = await toggleManagerStatus(managerId);
      
      // Update local state
      const updatedManagers = [...managers];
      updatedManagers[index] = updatedManager;
      setManagers(updatedManagers);
    } catch (err) {
      console.error('Error toggling manager status:', err);
      alert('Failed to update manager status. Please try again.');
    }
  };

  const handleDeleteManager = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      try {
        const managerId = managers[index].id;
        await deleteManager(managerId);
        
        // Update local state
        const updatedManagers = [...managers];
        updatedManagers.splice(index, 1);
        setManagers(updatedManagers);
      } catch (err) {
        console.error('Error deleting manager:', err);
        alert('Failed to delete manager. Please try again.');
      }
    }
  };

  const handleAddManager = () => {
    setIsEdit(false);
    setEditIndex(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const isIdUnique = (id: string, excludeIndex?: number): boolean => {
    return !managers.some((mgr, index) => 
      mgr.id === id && (excludeIndex === undefined || index !== excludeIndex)
    );
  };

  const handleSaveManager = async (data: ManagerFormData, index?: number) => {
    try {
      if (index === undefined) {
        // Adding new manager
        if (!isIdUnique(data.id)) {
          alert('This Manager ID is already in use.');
          return;
        }
        
        const newManager = await createManager(data);
        setManagers([...managers, newManager]);
      } else {
        // Editing existing manager
        if (data.id !== managers[index].id && !isIdUnique(data.id, index)) {
          alert('This Manager ID is already in use.');
          return;
        }
        
        const updatedManager = await updateManager(managers[index].id, data);
        
        // Update local state
        const updatedManagers = [...managers];
        updatedManagers[index] = updatedManager;
        setManagers(updatedManagers);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('Error saving manager:', err);
      alert('Failed to save manager data. Please try again.');
    }
  };

  // For simple loading indicator
  if (isLoading && managers.length === 0) {
    return <div className="flex min-h-screen bg-[#e0e5ec] justify-center items-center">
      <p className="text-xl">Loading manager data...</p>
    </div>;
  }

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Manager Management (Admin)</title>
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
                  <h1 className="text-3xl font-bold text-gray-800">Manager Management</h1>
                  <p className="text-lg text-gray-600">Manage manager records and performance</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    id="add-manager-btn" 
                    className="neo-button primary p-3"
                    onClick={handleAddManager}
                  >
                    <i className="bi bi-plus-lg mr-2"></i>Add Manager
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

            {/* Manager List */}
            <div className="neo-box p-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">Manager List</h2>
              {managers.length === 0 && !isLoading ? (
                <p className="text-center py-4">No managers found. Add your first manager!</p>
              ) : (
                <ManagerTable 
                  managers={filteredManagers}
                  onEdit={handleEditManager}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteManager}
                  onSort={handleSortTable}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manager Modal */}
      <ManagerModal 
        isOpen={isModalOpen}
        isEdit={isEdit}
        manager={isEdit && editIndex !== undefined ? managers[editIndex] : undefined}
        managerIndex={editIndex}
        onClose={handleCloseModal}
        onSave={handleSaveManager}
      />
    </>
  );
};

export default ManagerManagement; 