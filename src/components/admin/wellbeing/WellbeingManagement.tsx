import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebar from '../../admin/AdminSidebar';
import HeaderPanel from './HeaderPanel';
import FilterPanel from './FilterPanel';
import TeamOverviewPanel from './TeamOverviewPanel';
import PeopleList from './PeopleList';
import SummaryCharts from './SummaryCharts';
import WellbeingTrends from './WellbeingTrends';
import '../../../styles/NeomorphicUI.css';

export interface Person {
  id: number;
  name: string;
  role: 'employee' | 'manager';
  department: string;
  position: string;
  wellbeing: {
    stressLevel: number;
    workLifeBalance: number;
    satisfaction: number;
    lastCheckIn: string;
  };
}

export interface FilterOptions {
  department: string;
  status: string;
  role: string;
  searchQuery: string;
}

const WellbeingManagement: React.FC = () => {
  // Sample data for employees and managers
  const initialPeople: Person[] = [
    { id: 1, name: "John Doe", role: "employee", department: "Engineering", position: "Senior Developer", wellbeing: { stressLevel: 75, workLifeBalance: 82, satisfaction: 88, lastCheckIn: "2024-03-15" } },
    { id: 2, name: "Jane Smith", role: "employee", department: "Marketing", position: "Marketing Manager", wellbeing: { stressLevel: 65, workLifeBalance: 78, satisfaction: 85, lastCheckIn: "2024-03-15" } },
    { id: 3, name: "Alice Johnson", role: "manager", department: "Engineering", position: "Engineering Manager", wellbeing: { stressLevel: 80, workLifeBalance: 90, satisfaction: 92, lastCheckIn: "2024-03-15" } },
    { id: 4, name: "Bob Lee", role: "manager", department: "Sales", position: "Sales Manager", wellbeing: { stressLevel: 60, workLifeBalance: 70, satisfaction: 75, lastCheckIn: "2024-03-15" } },
    { id: 5, name: "Emily Brown", role: "employee", department: "HR", position: "HR Specialist", wellbeing: { stressLevel: 85, workLifeBalance: 88, satisfaction: 90, lastCheckIn: "2024-03-15" } },
    { id: 6, name: "Michael Green", role: "employee", department: "Sales", position: "Sales Executive", wellbeing: { stressLevel: 55, workLifeBalance: 60, satisfaction: 65, lastCheckIn: "2024-03-15" } },
    { id: 7, name: "Sarah White", role: "manager", department: "HR", position: "HR Manager", wellbeing: { stressLevel: 90, workLifeBalance: 95, satisfaction: 97, lastCheckIn: "2024-03-15" } },
  ];

  const [people] = useState<Person[]>(initialPeople);
  const [filters, setFilters] = useState<FilterOptions>({
    department: 'all',
    status: 'all',
    role: 'all',
    searchQuery: ''
  });
  const [filteredPeople, setFilteredPeople] = useState<Person[]>(people);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    applyFilters();
  }, [filters, people]);

  const applyFilters = () => {
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
        if (filters.status === 'good') return score >= 80;
        if (filters.status === 'warning') return score >= 60 && score < 80;
        if (filters.status === 'critical') return score < 60;
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
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const viewPersonDetails = (personId: number) => {
    const person = people.find(e => e.id === personId);
    if (person) {
      setSelectedPerson(person);
    }
  };

  const closePersonDetails = () => {
    setSelectedPerson(null);
  };

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
          />
          
          <TeamOverviewPanel 
            filteredPeople={filteredPeople} 
          />
          
          <PeopleList 
            people={filteredPeople} 
            onViewDetails={viewPersonDetails} 
          />
          
          <SummaryCharts 
            filteredPeople={filteredPeople} 
          />
          
          <WellbeingTrends />
        </div>
        
        {selectedPerson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closePersonDetails}>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">{selectedPerson.name}</h2>
              <p><span className="font-semibold">Role:</span> {selectedPerson.role.charAt(0).toUpperCase() + selectedPerson.role.slice(1)}</p>
              <p><span className="font-semibold">Department:</span> {selectedPerson.department}</p>
              <p><span className="font-semibold">Position:</span> {selectedPerson.position}</p>
              <h3 className="font-semibold mt-4 mb-2">Wellbeing Metrics:</h3>
              <p><span className="font-semibold">Stress Level:</span> {selectedPerson.wellbeing.stressLevel}%</p>
              <p><span className="font-semibold">Work-Life Balance:</span> {selectedPerson.wellbeing.workLifeBalance}%</p>
              <p><span className="font-semibold">Satisfaction:</span> {selectedPerson.wellbeing.satisfaction}%</p>
              <p><span className="font-semibold">Last Check-in:</span> {selectedPerson.wellbeing.lastCheckIn}</p>
              <button 
                className="mt-6 w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={closePersonDetails}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WellbeingManagement; 