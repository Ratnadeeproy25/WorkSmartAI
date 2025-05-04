import React from 'react';

interface SidebarToggleProps {
  toggleSidebar: () => void;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({ toggleSidebar }) => {
  return (
    <button 
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-[1001] lg:hidden p-2 rounded-lg bg-[#e0e5ec] shadow-lg flex items-center justify-center"
    >
      <i className="bi bi-list text-2xl"></i>
    </button>
  );
};

export default SidebarToggle; 