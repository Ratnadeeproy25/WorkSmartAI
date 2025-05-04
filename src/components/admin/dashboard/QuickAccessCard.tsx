import React from 'react';
import { Link } from 'react-router-dom';

interface QuickAccessCardProps {
  icon: string;
  title: string;
  description: string;
  link: string;
  color: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ 
  icon, 
  title, 
  description, 
  link, 
  color 
}) => {
  return (
    <Link to={link} className="quick-access-card">
      <i className={`bi ${icon} text-4xl text-${color}-500 mb-4`}></i>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
};

export default QuickAccessCard; 