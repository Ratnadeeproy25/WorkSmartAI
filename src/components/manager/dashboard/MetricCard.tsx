import React from 'react';

interface MetricCardProps {
  value: string | number;
  label: string;
  className?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  value, 
  label, 
  className, 
  icon, 
  trend 
}) => {
  return (
    <div className={`neo-box p-5 metric-card relative z-10 ${className || ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-2xl font-bold metric-value">{value}</div>
          <div className="text-sm text-gray-600 metric-label mt-1">{label}</div>
          
          {trend && (
            <div className={`text-xs flex items-center mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`bi ${trend.isPositive ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`}></i>
              <span>{trend.value}% from last week</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-opacity-20 icon-wrapper" 
               style={{ 
                 backgroundColor: `var(--${className?.split('-')[1] || 'primary'}-light)`,
                 boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
               }}>
            <i className={`bi ${icon} text-xl`}></i>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard; 