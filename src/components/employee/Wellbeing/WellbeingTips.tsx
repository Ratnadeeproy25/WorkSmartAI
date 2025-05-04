import React, { useState } from 'react';
import { WellnessTip } from './types';

const WellbeingTips: React.FC = () => {
  const [currentTip, setCurrentTip] = useState<number>(0);
  
  const tips: WellnessTip[] = [
    {
      icon: 'droplet-fill',
      iconColor: 'text-blue-500',
      title: 'Stay Hydrated',
      content: 'Keep a water bottle at your desk and aim to drink 8 glasses of water daily.'
    },
    {
      icon: 'eye-fill',
      iconColor: 'text-green-500',
      title: 'Eye Care',
      content: 'Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.'
    },
    {
      icon: 'person-standing',
      iconColor: 'text-purple-500',
      title: 'Posture Check',
      content: 'Maintain proper posture: Keep your back straight, shoulders relaxed, and feet flat on the floor.'
    }
  ];

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length);
  };

  return (
    <div className="p-6 bg-[#e0e5ec] rounded-xl shadow-[10px_10px_20px_#a3b1c6,_-10px_-10px_20px_#ffffff]" id="tips">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Wellbeing Tips</h2>
      <div className="relative overflow-hidden rounded-xl bg-[#e0e5ec] p-8 shadow-[inset_5px_5px_10px_#a3b1c6,_inset_-5px_-5px_10px_#ffffff] min-h-[250px]">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentTip * 100}%)` }}
        >
          {tips.map((tip, index) => (
            <div key={index} className="min-w-full p-8 bg-[#e0e5ec] rounded-xl shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] transition-all duration-300">
              {tip.icon === 'droplet-fill' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className={`mb-4 ${tip.iconColor}`} viewBox="0 0 16 16">
                  <path d="M8 16a6 6 0 0 0 6-6c0-1.655-1.122-2.904-2.432-4.362C10.254 4.176 8.75 2.503 8 0c0 0-6 5.686-6 10a6 6 0 0 0 6 6ZM6.646 4.646l.708.708c-.29.29-.444.617-.512.95l-.5.5c.666-.084 1.249-.566 1.78-1.218.085-.08.147-.164.15-.232.138.066.282.12.414.12.56 0 1-.14 1-.14a.5.5 0 0 0 .5-.5 3 3 0 1 1-3.54 3.54.5.5 0 0 0-.58.404l-.1.08a2 2 0 1 0 2.32-2.32c.058-.184.056-.466-.142-.584a.5.5 0 0 0-.598.04Z"/>
                </svg>
              )}
              {tip.icon === 'eye-fill' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className={`mb-4 ${tip.iconColor}`} viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                </svg>
              )}
              {tip.icon === 'person-standing' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className={`mb-4 ${tip.iconColor}`} viewBox="0 0 16 16">
                  <path d="M8 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM6 6.75v8.25h1.5V8.5h1v6.5H10V6.75a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75ZM9 4.75A1.75 1.75 0 0 0 7.25 3h-1.5A1.75 1.75 0 0 0 4 4.75v.75h5v-.75Z"/>
                </svg>
              )}
              <h3 className="text-xl font-semibold mb-2">{tip.title}</h3>
              <p className="text-gray-600">{tip.content}</p>
            </div>
          ))}
        </div>
        <button 
          onClick={prevTip}
          className="absolute top-1/2 left-4 -translate-y-1/2 w-12 h-12 rounded-full bg-[#e0e5ec] shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:scale-110 transition-all duration-300 flex items-center justify-center z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-left" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
        <button 
          onClick={nextTip}
          className="absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 rounded-full bg-[#e0e5ec] shadow-[5px_5px_10px_#a3b1c6,_-5px_-5px_10px_#ffffff] hover:shadow-[8px_8px_16px_#a3b1c6,_-8px_-8px_16px_#ffffff] hover:scale-110 transition-all duration-300 flex items-center justify-center z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-right" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WellbeingTips; 