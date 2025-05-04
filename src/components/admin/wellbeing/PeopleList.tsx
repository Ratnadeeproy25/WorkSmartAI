import React from 'react';
import { Person } from './WellbeingManagement';
import PersonCard from './PersonCard';

interface PeopleListProps {
  people: Person[];
  onViewDetails: (personId: number) => void;
}

const PeopleList: React.FC<PeopleListProps> = ({ people, onViewDetails }) => {
  return (
    <div className="neo-box p-5 mb-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">People Wellbeing Status</h2>
      
      {people.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No people match the current filters. Try adjusting your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {people.map(person => (
            <PersonCard 
              key={person.id}
              person={person}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
      
      <div className="mt-3 text-right text-xs text-gray-500">
        Showing {people.length} people
      </div>
    </div>
  );
};

export default PeopleList; 