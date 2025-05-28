import React, { useState } from 'react';
import { useWellbeingContext } from '../../../context/WellbeingContext';

const WellbeingFactorsEditor: React.FC = () => {
  const { managerWellbeing, updateWellbeing } = useWellbeingContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedFactors, setEditedFactors] = useState({
    stressLevel: {
      teamSupport: managerWellbeing.stressLevel.factors.teamSupport,
      workEnvironment: managerWellbeing.stressLevel.factors.workEnvironment,
    },
    jobSatisfaction: {
      roleClarity: managerWellbeing.jobSatisfaction.factors.roleClarity,
      skillUtilization: managerWellbeing.jobSatisfaction.factors.skillUtilization,
      growthOpportunities: managerWellbeing.jobSatisfaction.factors.growthOpportunities,
      teamDynamics: managerWellbeing.jobSatisfaction.factors.teamDynamics,
    },
    teamCollaboration: {
      communicationQuality: managerWellbeing.teamCollaboration.factors.communicationQuality,
      peerSupport: managerWellbeing.teamCollaboration.factors.peerSupport,
      conflictResolution: managerWellbeing.teamCollaboration.factors.conflictResolution,
      teamworkEfficiency: managerWellbeing.teamCollaboration.factors.teamworkEfficiency,
    },
  });

  const handleFactorChange = (category: string, factor: string, value: string) => {
    setEditedFactors(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [factor]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      // Update wellbeing metrics with new factors
      await updateWellbeing({
        stressLevel: {
          ...managerWellbeing.stressLevel,
          factors: {
            ...managerWellbeing.stressLevel.factors,
            teamSupport: editedFactors.stressLevel.teamSupport,
            workEnvironment: editedFactors.stressLevel.workEnvironment,
          },
        },
        jobSatisfaction: {
          ...managerWellbeing.jobSatisfaction,
          factors: {
            ...managerWellbeing.jobSatisfaction.factors,
            roleClarity: editedFactors.jobSatisfaction.roleClarity,
            skillUtilization: editedFactors.jobSatisfaction.skillUtilization,
            growthOpportunities: editedFactors.jobSatisfaction.growthOpportunities,
            teamDynamics: editedFactors.jobSatisfaction.teamDynamics,
          },
        },
        teamCollaboration: {
          ...managerWellbeing.teamCollaboration,
          factors: {
            ...managerWellbeing.teamCollaboration.factors,
            communicationQuality: editedFactors.teamCollaboration.communicationQuality,
            peerSupport: editedFactors.teamCollaboration.peerSupport,
            conflictResolution: editedFactors.teamCollaboration.conflictResolution,
            teamworkEfficiency: editedFactors.teamCollaboration.teamworkEfficiency,
          },
        },
      });

      setIsEditing(false);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-green-500 text-white z-50';
      notification.textContent = 'Wellbeing factors updated successfully!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('Error updating wellbeing factors:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-red-500 text-white z-50';
      notification.textContent = 'Failed to update wellbeing factors. Please try again.';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  };

  const handleCancel = () => {
    setEditedFactors({
      stressLevel: {
        teamSupport: managerWellbeing.stressLevel.factors.teamSupport,
        workEnvironment: managerWellbeing.stressLevel.factors.workEnvironment,
      },
      jobSatisfaction: {
        roleClarity: managerWellbeing.jobSatisfaction.factors.roleClarity,
        skillUtilization: managerWellbeing.jobSatisfaction.factors.skillUtilization,
        growthOpportunities: managerWellbeing.jobSatisfaction.factors.growthOpportunities,
        teamDynamics: managerWellbeing.jobSatisfaction.factors.teamDynamics,
      },
      teamCollaboration: {
        communicationQuality: managerWellbeing.teamCollaboration.factors.communicationQuality,
        peerSupport: managerWellbeing.teamCollaboration.factors.peerSupport,
        conflictResolution: managerWellbeing.teamCollaboration.factors.conflictResolution,
        teamworkEfficiency: managerWellbeing.teamCollaboration.factors.teamworkEfficiency,
      },
    });
    setIsEditing(false);
  };

  const SelectField: React.FC<{
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    disabled?: boolean;
  }> = ({ label, value, options, onChange, disabled = false }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="neo-box p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Wellbeing Factors Configuration</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="neo-button px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <i className="bi bi-pencil mr-2"></i>
            Edit Factors
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="neo-button px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <i className="bi bi-check mr-2"></i>
              Save
            </button>
            <button
              onClick={handleCancel}
              className="neo-button px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <i className="bi bi-x mr-2"></i>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stress Level Factors */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <i className="bi bi-heart-pulse mr-2 text-green-600"></i>
            Stress Level Factors
          </h3>
          
          <SelectField
            label="Team Support"
            value={isEditing ? editedFactors.stressLevel.teamSupport : managerWellbeing.stressLevel.factors.teamSupport}
            options={['High', 'Moderate', 'Low']}
            onChange={(value) => handleFactorChange('stressLevel', 'teamSupport', value)}
            disabled={!isEditing}
          />
          
          <SelectField
            label="Work Environment"
            value={isEditing ? editedFactors.stressLevel.workEnvironment : managerWellbeing.stressLevel.factors.workEnvironment}
            options={['Positive', 'Neutral', 'Negative']}
            onChange={(value) => handleFactorChange('stressLevel', 'workEnvironment', value)}
            disabled={!isEditing}
          />

          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Auto-calculated:</strong> Deadline Pressure ({managerWellbeing.stressLevel.factors.deadlinePressure}), 
              Workload ({managerWellbeing.stressLevel.factors.workload})
            </p>
          </div>
        </div>

        {/* Job Satisfaction Factors */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <i className="bi bi-emoji-smile mr-2 text-purple-600"></i>
            Job Satisfaction Factors
          </h3>
          
          <SelectField
            label="Role Clarity"
            value={isEditing ? editedFactors.jobSatisfaction.roleClarity : managerWellbeing.jobSatisfaction.factors.roleClarity}
            options={['High', 'Good', 'Moderate', 'Low']}
            onChange={(value) => handleFactorChange('jobSatisfaction', 'roleClarity', value)}
            disabled={!isEditing}
          />
          
          <SelectField
            label="Skill Utilization"
            value={isEditing ? editedFactors.jobSatisfaction.skillUtilization : managerWellbeing.jobSatisfaction.factors.skillUtilization}
            options={['Optimal', 'Good', 'Moderate', 'Underutilized']}
            onChange={(value) => handleFactorChange('jobSatisfaction', 'skillUtilization', value)}
            disabled={!isEditing}
          />
          
          <SelectField
            label="Growth Opportunities"
            value={isEditing ? editedFactors.jobSatisfaction.growthOpportunities : managerWellbeing.jobSatisfaction.factors.growthOpportunities}
            options={['Good', 'Moderate', 'Limited']}
            onChange={(value) => handleFactorChange('jobSatisfaction', 'growthOpportunities', value)}
            disabled={!isEditing}
          />
          
          <SelectField
            label="Team Dynamics"
            value={isEditing ? editedFactors.jobSatisfaction.teamDynamics : managerWellbeing.jobSatisfaction.factors.teamDynamics}
            options={['Excellent', 'Good', 'Moderate', 'Poor']}
            onChange={(value) => handleFactorChange('jobSatisfaction', 'teamDynamics', value)}
            disabled={!isEditing}
          />

          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Auto-calculated:</strong> Task Completion Rate ({managerWellbeing.jobSatisfaction.factors.taskCompletionRate}%)
            </p>
          </div>
        </div>

        {/* Team Collaboration Factors */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <i className="bi bi-people mr-2 text-yellow-600"></i>
            Team Collaboration Factors
          </h3>
          
          <SelectField
            label="Communication Quality"
            value={isEditing ? editedFactors.teamCollaboration.communicationQuality : managerWellbeing.teamCollaboration.factors.communicationQuality}
            options={['Excellent', 'Good', 'Moderate', 'Poor']}
            onChange={(value) => handleFactorChange('teamCollaboration', 'communicationQuality', value)}
            disabled={!isEditing}
          />
          
          <SelectField
            label="Peer Support"
            value={isEditing ? editedFactors.teamCollaboration.peerSupport : managerWellbeing.teamCollaboration.factors.peerSupport}
            options={['High', 'Moderate', 'Low']}
            onChange={(value) => handleFactorChange('teamCollaboration', 'peerSupport', value)}
            disabled={!isEditing}
          />
          
          <SelectField
            label="Conflict Resolution"
            value={isEditing ? editedFactors.teamCollaboration.conflictResolution : managerWellbeing.teamCollaboration.factors.conflictResolution}
            options={['Good', 'Moderate', 'Poor']}
            onChange={(value) => handleFactorChange('teamCollaboration', 'conflictResolution', value)}
            disabled={!isEditing}
          />
          
          <SelectField
            label="Teamwork Efficiency"
            value={isEditing ? editedFactors.teamCollaboration.teamworkEfficiency : managerWellbeing.teamCollaboration.factors.teamworkEfficiency}
            options={['High', 'Moderate', 'Low']}
            onChange={(value) => handleFactorChange('teamCollaboration', 'teamworkEfficiency', value)}
            disabled={!isEditing}
          />
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-md font-semibold text-blue-800 mb-2">
          <i className="bi bi-info-circle mr-2"></i>
          How Wellbeing Scores Are Calculated
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <strong>Work-Life Balance:</strong> Automatically calculated from work hours, breaks count, after-hours work, and focus time.
          </div>
          <div>
            <strong>Stress Level:</strong> Based on deadline pressure (from tasks), workload (from tasks), team support, and work environment.
          </div>
          <div>
            <strong>Job Satisfaction:</strong> Combines role clarity, skill utilization, growth opportunities, team dynamics, and task completion rate.
          </div>
          <div>
            <strong>Team Collaboration:</strong> Based on communication quality, peer support, conflict resolution, and teamwork efficiency.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellbeingFactorsEditor; 