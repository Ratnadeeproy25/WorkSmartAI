import React from 'react';
import { Person } from '../../../services/adminWellbeingService';

interface TeamOverviewPanelProps {
  filteredPeople: Person[];
  loading?: boolean;
  onRefresh?: () => void;
}

const TeamOverviewPanel: React.FC<TeamOverviewPanelProps> = ({ 
  filteredPeople, 
  loading = false, 
  onRefresh 
}) => {
  const total = filteredPeople.length;
  const good = filteredPeople.filter(e => e.wellbeing.stressLevel < 60).length;
  const warning = filteredPeople.filter(e => e.wellbeing.stressLevel >= 60 && e.wellbeing.stressLevel < 80).length;
  const critical = filteredPeople.filter(e => e.wellbeing.stressLevel >= 80).length;

  return (
    <div className="neo-box p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Team Overview</h2>
        {onRefresh && (
          <button 
            className="neo-button p-3 text-blue-600 hover:text-blue-800 transition-colors"
            onClick={onRefresh}
            disabled={loading}
          >
            <i className={`bi ${loading ? 'bi-arrow-clockwise animate-spin' : 'bi-arrow-clockwise'} mr-2`}></i>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="neo-box p-4 text-center">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-sm text-gray-600">Total People</div>
            </>
          )}
        </div>
        <div className="neo-box p-4 text-center">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-green-600">{good}</div>
              <div className="text-sm text-gray-600">Good Status</div>
            </>
          )}
        </div>
        <div className="neo-box p-4 text-center">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-yellow-600">{warning}</div>
              <div className="text-sm text-gray-600">Warning Status</div>
            </>
          )}
        </div>
        <div className="neo-box p-4 text-center">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-red-600">{critical}</div>
              <div className="text-sm text-gray-600">Critical Status</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewPanel; 