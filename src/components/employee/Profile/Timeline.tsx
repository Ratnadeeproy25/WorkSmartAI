import React, { useState } from 'react';
import { TimelineItem } from './types';

interface TimelineProps {
  items: TimelineItem[];
}

const Timeline: React.FC<TimelineProps> = ({ items }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter options
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'projects', label: 'Projects' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'tasks', label: 'Tasks' }
  ];
  
  // Filter function for timeline items
  const getFilteredItems = () => {
    if (activeFilter === 'all') {
      return items;
    }
    
    // In a real application, we would filter based on item category/type
    // For demo purposes, we'll return all items
    return items;
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity Timeline</h3>
      
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {filters.map(filter => (
          <button 
            key={filter.id}
            className={`timeline-filter ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      <div className="space-y-4">
        {getFilteredItems().map(item => (
          <div key={item.id} className="timeline-item">
            <div className={`timeline-dot ${item.color}`}></div>
            <div className="timeline-content">
              <div className="timeline-title">{item.title}</div>
              <div className="timeline-time">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline; 