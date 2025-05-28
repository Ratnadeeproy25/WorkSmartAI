import React, { useState, useEffect } from 'react';
import NotificationService from './NotificationService';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  wellbeingStatus?: 'excellent' | 'good' | 'fair' | 'concerning' | null;
  lastCheckIn?: string | null;
}

const TeamWellbeingCheck: React.FC = () => {
  const [showCheckPrompt, setShowCheckPrompt] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Alex Johnson', role: 'Frontend Developer', wellbeingStatus: 'good', lastCheckIn: '2023-05-10' },
    { id: '2', name: 'Sarah Williams', role: 'UI Designer', wellbeingStatus: 'excellent', lastCheckIn: '2023-05-12' },
    { id: '3', name: 'Michael Chen', role: 'Backend Developer', wellbeingStatus: 'fair', lastCheckIn: '2023-05-08' },
    { id: '4', name: 'Emma Rodriguez', role: 'Product Manager', wellbeingStatus: null, lastCheckIn: null },
    { id: '5', name: 'David Lee', role: 'QA Engineer', wellbeingStatus: 'good', lastCheckIn: '2023-05-11' }
  ]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  // Listen for team wellbeing check notifications
  useEffect(() => {
    const handleTeamWellbeingNotification = () => {
      setShowCheckPrompt(true);
      
      // Create notification on page
      const checkPrompt = document.createElement('div');
      checkPrompt.className = 'fixed top-4 right-4 p-4 bg-blue-500 text-white rounded-lg shadow-lg z-50 max-w-sm';
      checkPrompt.innerHTML = `
        <div class="font-bold">Team Wellbeing Check</div>
        <div>Today is scheduled for your team wellbeing check-in. Would you like to review your team now?</div>
        <div class="mt-2 flex justify-end">
          <button id="goToTeamCheck" class="px-4 py-1 bg-white text-blue-500 rounded">Review Team</button>
        </div>
      `;
      
      document.body.appendChild(checkPrompt);
      
      // Add click event to scroll to team check section
      const checkBtn = document.getElementById('goToTeamCheck');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          const teamCheckSection = document.getElementById('team-check');
          if (teamCheckSection) {
            teamCheckSection.scrollIntoView({ behavior: 'smooth' });
          }
          checkPrompt.remove();
        });
      }
      
      // Auto-remove after 10 seconds if no action taken
      setTimeout(() => {
        if (document.body.contains(checkPrompt)) {
          checkPrompt.remove();
        }
      }, 10000);
    };
    
    NotificationService.addEventListener('teamWellbeing', handleTeamWellbeingNotification);
    
    return () => {
      NotificationService.removeEventListener('teamWellbeing', handleTeamWellbeingNotification);
    };
  }, []);

  const startTeamCheck = () => {
    setShowCheckPrompt(false);
    NotificationService.updateTimestamp('lastTeamCheck');
  };

  const updateMemberStatus = (memberId: string, status: 'excellent' | 'good' | 'fair' | 'concerning') => {
    setTeamMembers(members => 
      members.map(member => 
        member.id === memberId 
          ? { ...member, wellbeingStatus: status, lastCheckIn: new Date().toISOString().split('T')[0] } 
          : member
      )
    );
    
    setSelectedMember(null);
  };

  const openMemberCheck = (memberId: string) => {
    setSelectedMember(memberId);
    
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // Create a modal for checking in with this team member
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
    modal.innerHTML = `
      <div class="bg-[#e0e5ec] rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-gray-700 mb-2">Check in with ${member.name}</h3>
        <p class="text-gray-600 mb-4">${member.role}</p>
        
        <div class="mb-6">
          <h4 class="font-medium text-gray-700 mb-3">How is ${member.name.split(' ')[0]}'s wellbeing?</h4>
          <div class="grid grid-cols-2 gap-2">
            <button id="status-excellent" class="p-3 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 font-medium">
              Excellent
            </button>
            <button id="status-good" class="p-3 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium">
              Good
            </button>
            <button id="status-fair" class="p-3 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium">
              Fair
            </button>
            <button id="status-concerning" class="p-3 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-medium">
              Concerning
            </button>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button id="cancelCheck" class="bg-gray-300 text-gray-700 rounded-lg px-4 py-2">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for status buttons
    ['excellent', 'good', 'fair', 'concerning'].forEach(status => {
      const btn = document.getElementById(`status-${status}`);
      if (btn) {
        btn.addEventListener('click', () => {
          updateMemberStatus(memberId, status as any);
          modal.remove();
        });
      }
    });
    
    // Handle cancel button
    const cancelBtn = document.getElementById('cancelCheck');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        setSelectedMember(null);
        modal.remove();
      });
    }
  };

  return (
    <div className="neo-box p-6" id="team-check">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Team Wellbeing Check</h2>
        <button 
          className="neo-button px-4 py-2 flex items-center"
          onClick={startTeamCheck}
        >
          <i className="bi bi-clipboard-check mr-2"></i>
          Start Check-in
        </button>
      </div>
      
      {showCheckPrompt && (
        <div className="neo-box p-4 mb-6 bg-blue-50">
          <div className="flex items-center">
            <div className="mr-4 text-blue-500">
              <i className="bi bi-info-circle text-2xl"></i>
            </div>
            <div>
              <p className="text-gray-700">
                It's time for your scheduled team wellbeing check-in. Review your team members' wellbeing.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {teamMembers.map(member => (
          <div key={member.id} className="neo-box p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-700">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.role}</p>
                {member.lastCheckIn && (
                  <p className="text-xs text-gray-500 mt-1">Last check-in: {member.lastCheckIn}</p>
                )}
              </div>
              <div className="flex items-center">
                {member.wellbeingStatus ? (
                  <span className={`px-3 py-1 rounded-full text-sm mr-3 ${
                    member.wellbeingStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                    member.wellbeingStatus === 'good' ? 'bg-blue-100 text-blue-800' :
                    member.wellbeingStatus === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {member.wellbeingStatus.charAt(0).toUpperCase() + member.wellbeingStatus.slice(1)}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 mr-3">
                    Not checked
                  </span>
                )}
                <button 
                  className="neo-button p-2"
                  onClick={() => openMemberCheck(member.id)}
                >
                  <i className="bi bi-pencil"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamWellbeingCheck; 