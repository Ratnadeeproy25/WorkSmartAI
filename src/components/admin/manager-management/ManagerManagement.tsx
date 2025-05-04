import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AdminSidebar } from '../dashboard';
import ManagerTable from './ManagerTable';
import ManagerModal from './ManagerModal';
import SearchAndFilters from './SearchAndFilters';
import { Manager, ManagerFormData } from './types';

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

  // Load managers from localStorage on component mount
  useEffect(() => {
    const storedManagers = localStorage.getItem('managers');
    if (storedManagers) {
      setManagers(JSON.parse(storedManagers));
    } else {
      // Default managers if none exist in localStorage
      const defaultManagers: Manager[] = [
        { id: 'MG001', name: 'Manager One', department: 'Development', position: 'Team Lead', status: 'Active' as 'Active' },
        { id: 'MG002', name: 'Manager Two', department: 'Design', position: 'Design Lead', status: 'Inactive' as 'Inactive' }
      ];
      setManagers(defaultManagers);
      localStorage.setItem('managers', JSON.stringify(defaultManagers));
    }
  }, []);

  // Update departments when managers change
  useEffect(() => {
    const uniqueDepartments = Array.from(new Set(managers.map(m => m.department)));
    setDepartments(uniqueDepartments);
  }, [managers]);

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
      const aValue = a[sortColumn as keyof Manager].toString().toLowerCase();
      const bValue = b[sortColumn as keyof Manager].toString().toLowerCase();
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

  const handleToggleStatus = (index: number) => {
    const updatedManagers = [...managers];
    updatedManagers[index].status = updatedManagers[index].status === 'Active' ? 'Inactive' : 'Active';
    setManagers(updatedManagers);
    localStorage.setItem('managers', JSON.stringify(updatedManagers));
  };

  const handleDeleteManager = (index: number) => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      const updatedManagers = [...managers];
      updatedManagers.splice(index, 1);
      setManagers(updatedManagers);
      localStorage.setItem('managers', JSON.stringify(updatedManagers));
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

  const generateManagerId = (): string => {
    const lastId = managers.length > 0 ? 
      parseInt(managers[managers.length - 1].id.substring(2)) : 0;
    return `MG${String(lastId + 1).padStart(3, '0')}`;
  };

  const isIdUnique = (id: string, excludeIndex?: number): boolean => {
    return !managers.some((mgr, index) => 
      mgr.id === id && (excludeIndex === undefined || index !== excludeIndex)
    );
  };

  const handleSaveManager = (data: ManagerFormData, index?: number) => {
    // Check if ID is unique for new managers or edited managers with changed ID
    if (index === undefined) {
      // Adding new manager
      if (!isIdUnique(data.id)) {
        alert('This Manager ID is already in use.');
        return;
      }
      
      const newManager: Manager = {
        ...data,
        status: 'Active'
      };
      
      const updatedManagers = [...managers, newManager];
      setManagers(updatedManagers);
      localStorage.setItem('managers', JSON.stringify(updatedManagers));
    } else {
      // Editing existing manager
      if (data.id !== managers[index].id && !isIdUnique(data.id, index)) {
        alert('This Manager ID is already in use.');
        return;
      }
      
      const updatedManagers = [...managers];
      updatedManagers[index] = {
        ...updatedManagers[index],
        ...data
      };
      
      setManagers(updatedManagers);
      localStorage.setItem('managers', JSON.stringify(updatedManagers));
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
                  <h1 className="text-3xl font-bold text-gray-800">Manager Management</h1>
                  <p className="text-lg text-gray-600">Manage manager records and performance</p>
                </div>
                <div className="flex gap-4">
                  <button className="neo-button p-3">
                    <i className="bi bi-bell text-xl"></i>
                  </button>
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
              <ManagerTable 
                managers={filteredManagers}
                onEdit={handleEditManager}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteManager}
                onSort={handleSortTable}
              />
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