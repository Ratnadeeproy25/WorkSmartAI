import React from 'react';

interface MetricCardProps {
  value: string | number;
  label: string;
  id: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ value, label, id, color }) => {
  return (
    <div className="metric-card">
      <div className={`text-2xl font-bold text-${color}-600`} id={id}>
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

export default MetricCard; 