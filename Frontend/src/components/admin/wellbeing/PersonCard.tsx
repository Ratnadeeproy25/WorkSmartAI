import React from 'react';
import { Person } from '../../../services/adminWellbeingService';

interface PersonCardProps {
  person: Person;
  onViewDetails: (personId: string) => void;
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`person-card shadow-sm ${person.role === 'manager' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-800">{person.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              person.role === 'manager' 
                ? 'bg-blue-600 text-white border border-blue-700 shadow-sm' 
                : 'bg-green-600 text-white border border-green-700 shadow-sm'
            }`}>
              {person.role === 'manager' ? '👔 Manager' : '👤 Employee'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{person.position}</p>
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
          <div className="text-sm font-medium text-gray-600">{formatDate(person.wellbeing.lastCheckIn)}</div>
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