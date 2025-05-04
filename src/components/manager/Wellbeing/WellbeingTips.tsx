import React, { useState } from 'react';

interface Tip {
  id: number;
  icon: string;
  iconColor: string;
  title: string;
  content: string;
}

const WellbeingTips: React.FC = () => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips: Tip[] = [
    {
      id: 1,
      icon: 'bi-people-fill',
      iconColor: 'text-blue-500',
      title: 'Delegate Effectively',
      content: 'Learn to delegate tasks to reduce your workload and empower your team members.'
    },
    {
      id: 2,
      icon: 'bi-chat-dots-fill',
      iconColor: 'text-green-500',
      title: 'Open Communication',
      content: 'Maintain open lines of communication with your team to reduce stress and build trust.'
    },
    {
      id: 3,
      icon: 'bi-calendar-check',
      iconColor: 'text-purple-500',
      title: 'Set Boundaries',
      content: 'Establish clear boundaries between work and personal life to maintain work-life balance.'
    }
  ];
  
  const goToNext = () => {
    setCurrentTip((currentTip + 1) % tips.length);
  };
  
  const goToPrev = () => {
    setCurrentTip((currentTip - 1 + tips.length) % tips.length);
  };
  
  return (
    <div className="neo-box p-6" id="tips">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Manager Wellbeing Tips</h2>
      <div className="tips-carousel">
        <div 
          className="tips-container"
          style={{ transform: `translateX(-${currentTip * 100}%)` }}
        >
          {tips.map((tip) => (
            <div className="tip-card" key={tip.id}>
              <i className={`bi ${tip.icon} text-3xl ${tip.iconColor} mb-4`}></i>
              <h3 className="text-xl font-semibold mb-2">{tip.title}</h3>
              <p className="text-gray-600">{tip.content}</p>
            </div>
          ))}
        </div>
        <button 
          className="tip-nav prev" 
          onClick={goToPrev}
          aria-label="Previous tip"
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        <button 
          className="tip-nav next" 
          onClick={goToNext}
          aria-label="Next tip"
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default WellbeingTips; 