import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebar from '../../admin/AdminSidebar';
import HeaderPanel from './HeaderPanel';
import FilterPanel from './FilterPanel';
import TeamOverviewPanel from './TeamOverviewPanel';
import PeopleList from './PeopleList';
import SummaryCharts from './SummaryCharts';
import WellbeingTrends from './WellbeingTrends';
import { getAllWellbeingData, Person } from '../../../services/adminWellbeingService';
import { getAllCombinedDepartments } from '../../../services/employeeService';
import '../../../styles/NeomorphicUI.css';

export interface FilterOptions {
  department: string;
  status: string;
  role: string;
  searchQuery: string;
}

const WellbeingManagement: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    department: 'all',
    status: 'all',
    role: 'all',
    searchQuery: ''
  });
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);

  const fetchWellbeingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWellbeingData();
      console.log('Fetched wellbeing data:', data); // Debug log
      setPeople(data);
    } catch (err: any) {
      console.error('Error fetching wellbeing data:', err);
      setError(err.message || 'Failed to fetch wellbeing data');
      // Set empty array as fallback
      setPeople([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const departmentData = await getAllCombinedDepartments();
      setDepartments(departmentData);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      // Continue with empty departments array if fetch fails
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = people;
    
    if (filters.role !== 'all') {
      filtered = filtered.filter(e => e.role === filters.role);
    }
    
    if (filters.department !== 'all') {
      filtered = filtered.filter(e => e.department.toLowerCase() === filters.department);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(e => {
        const score = e.wellbeing.stressLevel;
        if (filters.status === 'good') return score < 60;
        if (filters.status === 'warning') return score >= 60 && score < 80;
        if (filters.status === 'critical') return score >= 80;
        return true;
      });
    }
    
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
      );
    }
    
    setFilteredPeople(filtered);
  }, [people, filters]);

  // Fetch wellbeing data and departments on component mount
  useEffect(() => {
    fetchWellbeingData();
    fetchDepartments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const viewPersonDetails = (personId: string) => {
    // This function is now handled by the PeopleList component's internal modal
    console.log('Viewing details for person:', personId);
  };

  // Loading state
  if (loading && people.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-lg text-gray-600">Loading wellbeing data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && people.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading wellbeing data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={fetchWellbeingData}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-auto">
        <Helmet>
          <title>WorkSmart AI - Wellbeing Overview (Admin)</title>
        </Helmet>
        
        <div className="max-w-7xl mx-auto space-y-8">
          <HeaderPanel />
          
          <FilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange}
            departments={departments}
          />
          
          <TeamOverviewPanel 
            filteredPeople={filteredPeople}
            loading={loading}
            onRefresh={fetchWellbeingData}
          />
          
          <PeopleList 
            people={filteredPeople} 
            onViewDetails={viewPersonDetails}
            loading={loading}
          />
          
          <SummaryCharts 
            filteredPeople={filteredPeople} 
          />
          
          <WellbeingTrends />
        </div>
      </div>
    </div>
  );
};

export default WellbeingManagement; 