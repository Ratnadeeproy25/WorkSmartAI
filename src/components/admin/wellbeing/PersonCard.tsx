import React from 'react';
import { Person } from './WellbeingManagement';

interface PersonCardProps {
  person: Person;
  onViewDetails: (personId: number) => void;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, onViewDetails }) => {
  const getStatusClass = (score: number) => {
    if (score >= 80) return 'status-good';
    if (score >= 60) return 'status-warning';
    return 'status-critical';
  };

  const getStatusText = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Warning';
    return 'Critical';
  };

  return (
    <div className="person-card bg-gray-50 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{person.name}</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {person.position}
            <span className={`ml-1 px-1.5 py-0.5 rounded-sm text-xs ${person.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
              {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{person.department}</p>
        </div>
        <div className="flex items-center">
          <span className={`status-indicator ${getStatusClass(person.wellbeing.stressLevel)}`}></span>
          <span className="text-xs font-medium ml-1">{getStatusText(person.wellbeing.stressLevel)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-gray-100 rounded">
          <div className="text-xl font-bold text-blue-600">{person.wellbeing.stressLevel}%</div>
          <div className="text-xs text-gray-500">Stress Level</div>
        </div>
        <div className="p-2 bg-gray-100 rounded">
          <div className="text-xl font-bold text-green-600">{person.wellbeing.workLifeBalance}%</div>
          <div className="text-xs text-gray-500">Work-Life Balance</div>
        </div>
        <div className="p-2 bg-gray-100 rounded">
          <div className="text-xl font-bold text-purple-600">{person.wellbeing.satisfaction}%</div>
          <div className="text-xs text-gray-500">Satisfaction</div>
        </div>
        <div className="p-2 bg-gray-100 rounded">
          <div className="text-sm font-medium text-gray-600">{person.wellbeing.lastCheckIn}</div>
          <div className="text-xs text-gray-500">Last Check-in</div>
        </div>
      </div>
      
      <button 
        className="w-full py-1.5 text-sm bg-white border border-blue-200 text-blue-600 rounded hover:bg-blue-50 transition-colors"
        onClick={() => onViewDetails(person.id)}
      >
        View Details
      </button>
    </div>
  );
};

export default PersonCard; 