import React, { useEffect } from 'react';

type MetricCardProps = {
  icon: string;
  iconColor: string;
  title: string;
  iqarValue: number;
  iqarMax: number;
  time: string;
};

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconColor, title, iqarValue, iqarMax, time }) => {
  useEffect(() => {
      import('../style/MetricCard.css');
  }, []);

  const progressPercentage = (iqarValue / iqarMax) * 100;
  
  // Determina a cor da barra com base no protótipo
  const getProgressBarColor = () => {
    if (progressPercentage < 33) return 'var(--accent-green)';
    if (progressPercentage < 66) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon" style={{ backgroundColor: iconColor }}>
          {icon}
        </div>
        <h3>{title}</h3>
      </div>
      <div className="metric-body">
        <span>IQAr</span>
        <span className="ratio">{iqarValue}/{iqarMax}</span>
        <div className="metric-progress-bar">
          <div 
            className="metric-progress-bar-inner" 
            style={{ width: `${progressPercentage}%`, backgroundColor: getProgressBarColor() }}
          ></div>
        </div>
      </div>
      <div className="metric-footer">
        {time}
      </div>
    </div>
  );
};

export default MetricCard;