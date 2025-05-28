import React, { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  status: 'Active' | 'On Leave' | 'Absent';
  performance: number;
  avatar: string;
  lastActive: string;
  email: string;
}

interface TeamMembersProps {
  teamMembers?: TeamMember[];
  loading?: boolean;
}

const TeamMembers: React.FC<TeamMembersProps> = ({ teamMembers, loading }) => {
  const [sortField, setSortField] = useState<keyof TeamMember>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Default dummy data if no API data is provided
  const dummyTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      position: 'Frontend Developer',
      status: 'Active',
      performance: 92,
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      lastActive: '10 minutes ago',
      email: 'sarah.johnson@company.com'
    },
    {
      id: '2',
      name: 'Michael Chen',
      position: 'Backend Developer',
      status: 'Active',
      performance: 88,
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
      lastActive: '25 minutes ago',
      email: 'michael.chen@company.com'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      position: 'UI/UX Designer',
      status: 'On Leave',
      performance: 85,
      avatar: 'https://randomuser.me/api/portraits/women/56.jpg',
      lastActive: '2 days ago',
      email: 'emily.rodriguez@company.com'
    },
    {
      id: '4',
      name: 'David Kim',
      position: 'Product Manager',
      status: 'Active',
      performance: 94,
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      lastActive: '5 minutes ago',
      email: 'david.kim@company.com'
    },
    {
      id: '5',
      name: 'Olivia Wilson',
      position: 'Data Analyst',
      status: 'Absent',
      performance: 79,
      avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
      lastActive: '1 day ago',
      email: 'olivia.wilson@company.com'
    }
  ];

  // Use API data if available, otherwise use dummy data
  const displayMembers = teamMembers || dummyTeamMembers;

  // Sort team members
  const handleSort = (field: keyof TeamMember) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting and filtering
  const filteredAndSortedMembers = [...displayMembers]
    .filter(member => filterStatus === 'All' ? true : member.status === filterStatus)
    .sort((a, b) => {
      if (sortField === 'performance') {
        return sortDirection === 'asc' 
          ? a[sortField] - b[sortField]
          : b[sortField] - a[sortField];
      } else {
        const aValue = String(a[sortField]).toLowerCase();
        const bValue = String(b[sortField]).toLowerCase();
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

  const getSortIcon = (field: keyof TeamMember) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'On Leave': return 'bg-blue-100 text-blue-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-blue-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="neo-box p-6 team-members-container">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 dashboard-card-title">Team Members</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading team members...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-box p-6 team-members-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dashboard-card-title">Team Members</h3>
        <div className="flex gap-2">
          <select 
            className="neo-input p-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>
      
      {displayMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No team members found</div>
          <div className="text-sm text-gray-400">
            {teamMembers ? 'No employees are assigned to you yet.' : 'Unable to load team data.'}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full team-table">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>
                  Employee {getSortIcon('name')}
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('position')}>
                  Position {getSortIcon('position')}
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('status')}>
                  Status {getSortIcon('status')}
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('performance')}>
                  Performance {getSortIcon('performance')}
                </th>
                <th className="p-3">Last Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedMembers.map(member => (
                <tr key={member.id} className="table-row-hover">
                  <td className="p-3">
                    <div className="flex items-center">
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-8 h-8 rounded-full mr-3" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`;
                        }}
                      />
                      <div>
                        <span className="font-medium">{member.name}</span>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{member.position}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={getPerformanceColor(member.performance)}>
                      {member.performance}%
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-sm">{member.lastActive}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="neo-button-sm p-1" title="View profile">
                        <i className="bi bi-person text-gray-600"></i>
                      </button>
                      <button className="neo-button-sm p-1" title="Message">
                        <i className="bi bi-chat text-gray-600"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamMembers; 