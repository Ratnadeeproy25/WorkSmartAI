import React, { useState } from 'react';
import { SkillsData, Skill } from './types';

interface SkillsSectionProps {
  skills: SkillsData;
  onEndorseSkill: (category: 'technical' | 'soft', skillName: string) => void;
  onUpdateSkillLevel: (category: 'technical' | 'soft', skillName: string, newLevel: number) => void;
  onAddSkill: (category: 'technical' | 'soft', name: string, level: number) => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  onEndorseSkill,
  onUpdateSkillLevel,
  onAddSkill
}) => {
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillCategory, setNewSkillCategory] = useState<'technical' | 'soft'>('technical');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(3);

  // Open modal to add a new skill
  const handleShowAddSkillModal = (category: 'technical' | 'soft') => {
    setNewSkillCategory(category);
    setNewSkillName('');
    setNewSkillLevel(3);
    setShowAddSkillModal(true);
  };

  // Handle adding a new skill
  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      onAddSkill(newSkillCategory, newSkillName.trim(), newSkillLevel);
      setShowAddSkillModal(false);
    }
  };

  // Create skill badge component
  const SkillBadge = ({ skill, category }: { skill: Skill; category: 'technical' | 'soft' }) => {
    return (
      <div className="skill-badge">
        {skill.name} {Array(skill.level).fill('⭐').join('')}
        <div className="tooltip">
          <div className="font-medium mb-2">{skill.name}</div>
          <div className="text-sm mb-2">Level: {skill.level}/5</div>
          <div className="text-sm mb-2">{skill.endorsements} endorsements</div>
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdateSkillLevel(category, skill.name, Math.min(skill.level + 1, 5))}
              className="neo-button p-1 text-xs"
              disabled={skill.level >= 5}
            >
              <i className="bi bi-arrow-up"></i>
            </button>
            <button 
              onClick={() => onEndorseSkill(category, skill.name)}
              className="neo-button p-1 text-xs"
            >
              <i className="bi bi-hand-thumbs-up"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Skills</h3>
      
      <div className="space-y-6">
        {/* Technical Skills */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Technical Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills.technical.map((skill, index) => (
              <SkillBadge key={index} skill={skill} category="technical" />
            ))}
            <button 
              onClick={() => handleShowAddSkillModal('technical')}
              className="neo-button p-2"
            >
              <i className="bi bi-plus"></i> Add Skill
            </button>
          </div>
        </div>
        
        {/* Soft Skills */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Soft Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills.soft.map((skill, index) => (
              <SkillBadge key={index} skill={skill} category="soft" />
            ))}
            <button 
              onClick={() => handleShowAddSkillModal('soft')}
              className="neo-button p-2"
            >
              <i className="bi bi-plus"></i> Add Skill
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal for adding a new skill */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="neo-container p-6 rounded-xl max-w-sm w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Add New {newSkillCategory === 'technical' ? 'Technical' : 'Soft'} Skill
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Skill Name</label>
                <input 
                  type="text" 
                  placeholder="Enter skill name" 
                  className="neo-input p-3 w-full"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Skill Level (1-5)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    className="w-full"
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(parseInt(e.target.value))}
                  />
                  <span className="text-gray-700">{newSkillLevel}</span>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowAddSkillModal(false)}
                  className="neo-button p-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSkill}
                  className="neo-button primary p-2"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsSection; 