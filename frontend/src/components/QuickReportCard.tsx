import React from 'react';
import '../style/Dashboard.css';
import { Link } from 'react-router-dom';


type QuickReportCardProps = {
  title: string;
  items: Array<{
    linha: string;
    data: string;
    value: string;
    color: string;
  }>;
  unit: string;
  linkTo: string;
}

const QuickReportCard: React.FC<QuickReportCardProps> = ({ title, items, unit, linkTo }) => {

    return (
        <div className="report-card">
            <div className="report-header">
                <h3>{title}</h3>
                <Link to={linkTo}>Ver</Link>
            </div>
        <ul className="quick-report-list">
            {items.map((item: any) => (
                <li className="quick-report-item" key={item.linha}>
                    <div className="report-item-info">
                        <div className="report-item-dot" style={{ backgroundColor: item.color }}></div>
                        <div className="report-item-details">
                            <div className="linha">{item.linha}</div>
                            <div className="data">{item.data}</div>
                        </div>
                    </div>
                    <span className="report-item-value" style={{ color: item.color }}>
                        {item.value}{unit}
                    </span>
                </li>
            ))}
            </ul>
        </div>
    );
}

export default QuickReportCard;