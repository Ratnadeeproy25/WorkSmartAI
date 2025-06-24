import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebar from '../AdminSidebar';
import AdminTable from './AdminTable';
import AdminModal from './AdminModal';
import SearchAndFilters from './SearchAndFilters';
import { AdminFormData } from './types';
import { 
  Admin,
  getAllAdmins, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin, 
  toggleAdminStatus,
  generateAdminId
} from '../../../services/adminService';

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessLevels] = useState<string[]>(['Full', 'Limited']);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editIndex, setEditIndex] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load admins from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const adminData = await getAllAdmins();
        setAdmins(adminData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load admins. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter admins when search query, access level filter, or admins change
  useEffect(() => {
    let filtered = [...admins];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(admin => 
        admin.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply access level filter
    if (selectedAccessLevel !== 'All') {
      filtered = filtered.filter(admin => admin.accessLevel === selectedAccessLevel);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      // Handle nested properties
      const getSortValue = (admin: Admin, key: string) => {
        // Check if the key contains a period (e.g., 'nestedField.childField')
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          const parentObj = admin[parent as keyof Admin];
          // Return empty string if the parent object is undefined
          if (!parentObj || typeof parentObj !== 'object') {
            return '';
          }
          // Return the child property or empty string if undefined
          return (parentObj as any)[child]?.toString().toLowerCase() || '';
        }

        // Handle basic properties with undefined check
        const value = admin[key as keyof Admin];
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
    
    setFilteredAdmins(filtered);
    setCurrentPage(1);
  }, [admins, searchQuery, selectedAccessLevel, sortColumn, sortDirection]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleAccessLevelChange = (level: string) => {
    setSelectedAccessLevel(level);
  };

  const handleSortTable = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleEditAdmin = (index: number) => {
    setIsEdit(true);
    setEditIndex(index);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (index: number) => {
    try {
      const adminId = admins[index].id;
      const updatedAdmin = await toggleAdminStatus(adminId);
      
      // Update local state
      const updatedAdmins = [...admins];
      updatedAdmins[index] = updatedAdmin;
      setAdmins(updatedAdmins);
    } catch (err) {
      console.error('Error toggling admin status:', err);
      alert('Failed to update admin status. Please try again.');
    }
  };

  const handleDeleteAdmin = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        const adminId = admins[index].id;
        await deleteAdmin(adminId);
        
        // Update local state
        const updatedAdmins = [...admins];
        updatedAdmins.splice(index, 1);
        setAdmins(updatedAdmins);
      } catch (err) {
        console.error('Error deleting admin:', err);
        alert('Failed to delete admin. Please try again.');
      }
    }
  };

  const handleAddAdmin = () => {
    setIsEdit(false);
    setEditIndex(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const isIdUnique = (id: string, excludeIndex?: number): boolean => {
    return !admins.some((admin, index) => 
      admin.id === id && (excludeIndex === undefined || index !== excludeIndex)
    );
  };

  const handleSaveAdmin = async (data: AdminFormData, index?: number) => {
    try {
      if (index === undefined) {
        // Adding new admin
        if (!isIdUnique(data.id)) {
          alert('This Admin ID is already in use.');
          return;
        }
        
        const newAdmin = await createAdmin(data);
        setAdmins([...admins, newAdmin]);
      } else {
        // Editing existing admin
        if (data.id !== admins[index].id && !isIdUnique(data.id, index)) {
          alert('This Admin ID is already in use.');
          return;
        }
        
        const updatedAdmin = await updateAdmin(admins[index].id, data);
        
        // Update local state
        const updatedAdmins = [...admins];
        updatedAdmins[index] = updatedAdmin;
        setAdmins(updatedAdmins);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('Error saving admin:', err);
      alert('Failed to save admin data. Please try again.');
    }
  };

  // For simple loading indicator
  if (isLoading && admins.length === 0) {
    return <div className="flex min-h-screen bg-[#e0e5ec] justify-center items-center">
      <p className="text-xl">Loading admin data...</p>
    </div>;
  }

  return (
    <>
      <Helmet>
        <title>WorkSmart AI - Admin Management</title>
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
                  <h1 className="text-3xl font-bold text-gray-800">Admin Management</h1>
                  <p className="text-lg text-gray-600">Manage administrator records and permissions</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    id="add-admin-btn" 
                    className="neo-button primary p-3"
                    onClick={handleAddAdmin}
                  >
                    <i className="bi bi-plus-lg mr-2"></i>Add Admin
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
              accessLevels={accessLevels}
              selectedAccessLevel={selectedAccessLevel}
              onAccessLevelChange={handleAccessLevelChange}
            />

            {/* Admin Table */}
            <AdminTable 
              admins={filteredAdmins}
              onEdit={handleEditAdmin}
              onDelete={handleDeleteAdmin}
              onToggleStatus={handleToggleStatus}
              onSort={handleSortTable}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
            />

            {/* Admin Modal */}
            <AdminModal 
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSave={handleSaveAdmin}
              admin={isEdit && editIndex !== undefined ? admins[editIndex] : undefined}
              index={editIndex}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminManagement; 