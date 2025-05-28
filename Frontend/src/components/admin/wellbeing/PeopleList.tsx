import React, { useState } from 'react';
import { Person } from '../../../services/adminWellbeingService';

interface PeopleListProps {
  people: Person[];
  onViewDetails: (personId: string) => void;
  loading?: boolean;
}

const PeopleList: React.FC<PeopleListProps> = ({ people, onViewDetails, loading = false }) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Helper function to determine status based on stress level
  const getStatusClass = (score: number): string => {
    if (score < 60) return 'status-good';
    if (score < 80) return 'status-warning';
    return 'status-critical';
  };
  
  // Helper function to get status text based on stress level
  const getStatusText = (score: number): string => {
    if (score < 60) return 'Good';
    if (score < 80) return 'Warning';
    return 'Critical';
  };

  // Handle viewing detailed person wellbeing data
  const handleViewDetails = (person: Person) => {
    setSelectedPerson(person);
    setShowDetailModal(true);
    onViewDetails(person.id);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPerson(null);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="neo-box p-4 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-5 bg-gray-300 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-2 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-2 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-18"></div>
          <div className="h-2 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* People Wellbeing Status */}
      <div className="neo-box p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-700">People Wellbeing Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              Individual wellbeing metrics for all employees and managers
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total People</div>
            <div className="text-2xl font-bold text-blue-600">{people.length}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : people.length > 0 ? (
            people.map(person => (
              <div className="neo-box p-4" key={person.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">{person.name}</h3>
                    <p className="text-sm text-gray-600">{person.position}</p>
                    <p className="text-sm text-gray-500">{person.department}</p>
                    <p className="text-xs text-gray-400">
                      ID: {person.id} • {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusClass(person.wellbeing.stressLevel)}`}>
                    {getStatusText(person.wellbeing.stressLevel)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stress Level:</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            person.wellbeing.stressLevel < 60 ? 'bg-green-500' : 
                            person.wellbeing.stressLevel < 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${person.wellbeing.stressLevel}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{person.wellbeing.stressLevel}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Work-Life Balance:</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${person.wellbeing.workLifeBalance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{person.wellbeing.workLifeBalance}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Job Satisfaction:</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${person.wellbeing.satisfaction}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{person.wellbeing.satisfaction}%</span>
                    </div>
                  </div>
                  {person.wellbeing.teamCollaboration && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Team Collaboration:</span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="h-2 bg-purple-500 rounded-full"
                            style={{ width: `${person.wellbeing.teamCollaboration}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{person.wellbeing.teamCollaboration}%</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Activity Summary */}
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Recent Activities:</span>
                      <span>{person.wellbeing.activityHistory?.length || 0} logged</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Mood Entries:</span>
                      <span>{person.wellbeing.moodHistory?.length || 0} recorded</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Break Sessions:</span>
                      <span>{person.wellbeing.breakHistory?.length || 0} taken</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {person.wellbeing.lastCheckIn === 'No data' ? (
                      <div className="flex items-center">
                        <i className="bi bi-exclamation-circle mr-1 text-yellow-500"></i>
                        <span className="text-yellow-600">No wellbeing data recorded</span>
                      </div>
                    ) : (
                      <span>Last check-in: {new Date(person.wellbeing.lastCheckIn).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {/* View Details Button */}
                  <div className="mt-3 pt-2 border-t">
                    <button 
                      className="w-full neo-button p-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={() => handleViewDetails(person)}
                    >
                      <i className="bi bi-eye mr-1"></i>
                      View Detailed Report
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No wellbeing data available
            </div>
          )}
        </div>
      </div>

      {/* Detailed Person Wellbeing Modal */}
      {showDetailModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-700">{selectedPerson.name}</h2>
                  <p className="text-gray-600">{selectedPerson.position} • {selectedPerson.department}</p>
                  <p className="text-sm text-gray-500">
                    {selectedPerson.role.charAt(0).toUpperCase() + selectedPerson.role.slice(1)} ID: {selectedPerson.id}
                  </p>
                </div>
                <button 
                  className="neo-button p-2 text-gray-600 hover:text-gray-800"
                  onClick={closeDetailModal}
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>

              {/* Wellbeing Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="neo-box p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedPerson.wellbeing.stressLevel}%</div>
                  <div className="text-sm text-gray-600">Stress Level</div>
                  <div className={`text-xs mt-1 ${getStatusClass(selectedPerson.wellbeing.stressLevel)}`}>
                    {getStatusText(selectedPerson.wellbeing.stressLevel)}
                  </div>
                </div>
                <div className="neo-box p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedPerson.wellbeing.workLifeBalance}%</div>
                  <div className="text-sm text-gray-600">Work-Life Balance</div>
                </div>
                <div className="neo-box p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedPerson.wellbeing.satisfaction}%</div>
                  <div className="text-sm text-gray-600">Job Satisfaction</div>
                </div>
                {selectedPerson.wellbeing.teamCollaboration && (
                  <div className="neo-box p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPerson.wellbeing.teamCollaboration}%</div>
                    <div className="text-sm text-gray-600">Team Collaboration</div>
                  </div>
                )}
              </div>

              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="neo-box p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Activities</h3>
                  <div className="text-2xl font-bold text-blue-600">{selectedPerson.wellbeing.activityHistory?.length || 0}</div>
                  <div className="text-sm text-gray-600">Activities Logged</div>
                </div>
                <div className="neo-box p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Mood Entries</h3>
                  <div className="text-2xl font-bold text-green-600">{selectedPerson.wellbeing.moodHistory?.length || 0}</div>
                  <div className="text-sm text-gray-600">Moods Recorded</div>
                </div>
                <div className="neo-box p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Break Sessions</h3>
                  <div className="text-2xl font-bold text-purple-600">{selectedPerson.wellbeing.breakHistory?.length || 0}</div>
                  <div className="text-sm text-gray-600">Breaks Taken</div>
                </div>
              </div>

              {/* Last Check-in */}
              <div className="neo-box p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Last Check-in</h3>
                <div className="text-gray-600">
                  {selectedPerson.wellbeing.lastCheckIn === 'No data' ? (
                    <div className="flex items-center text-yellow-600">
                      <i className="bi bi-exclamation-circle mr-2"></i>
                      No wellbeing data has been recorded for this person
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <i className="bi bi-check-circle mr-2"></i>
                      Last updated: {new Date(selectedPerson.wellbeing.lastCheckIn).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PeopleList; 