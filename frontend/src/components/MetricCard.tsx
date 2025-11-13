import React from 'react';
import '../Dashboard.css';

type MetricCardProps = {
  icon: string;
  iconColor: string;
  title: string;
  iqarValue: number;
  iqarMax: number;
  time: string;
};

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconColor, title, iqarValue, iqarMax, time }) => {
  
  const progressPercentage = (iqarValue / iqarMax) * 100;
  
  // Determina a cor da barra com base no protótipo
  const getProgressBarColor = () => {
    if (progressPercentage < 33) return 'var(--accent-green)';
    if (progressPercentage < 66) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <div className="metric-card">
      <div className="card-header">
        <h3>{title}</h3>
        <div className="card-icon" style={{ backgroundColor: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="card-body">
        <p>IQAr</p>
        <div className="progress-bar">
          <div 
            className="progress-bar-inner" 
            style={{ width: `${progressPercentage}%`, backgroundColor: getProgressBarColor() }}
          ></div>
        </div>
        <span className="ratio">{iqarValue}/{iqarMax}</span>
      </div>
      <div className="card-footer">
        {time}
      </div>
    </div>
  );
};

export default MetricCard;