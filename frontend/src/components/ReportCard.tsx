import React from 'react';
import '../style/ReportCard.css';
import { Link } from 'react-router-dom';
import { FiBookmark } from 'react-icons/fi';

type ReportCardProps = {
  title: string;
  items: Array<{
    linha: string;
    lineId?: number;
    data: string;
    value: string;
    color: string;
  }>;
  unit: string;
  linkTo: string;
  onSaveRoute?: (lineId: number) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, items, unit, linkTo, onSaveRoute }) => {
    return (
        <div className="report-card">
            <div className="report-header">
                <h3>{title}</h3>
                <Link to={linkTo}>Ver</Link>
            </div>
        <ul className="report-list">
            {items.map((item: any) => (
                <li className="report-item" key={item.linha}>
                    <div className="report-item-info">
                        <div className="report-item-dot" style={{ backgroundColor: item.color }}></div>
                        <div className="report-item-details">
                            <div className="linha">{item.linha}</div>
                            <div className="data">{item.data}</div>
                        </div>
                    </div>
                    <div className="report-item-actions">
                        <span className="report-item-value" style={{ color: item.color }}>
                            {item.value}{unit}
                        </span>
                        {onSaveRoute && item.lineId && (
                            <button
                                className="save-route-btn"
                                onClick={() => onSaveRoute(item.lineId)}
                                title="Salvar no histórico"
                            >
                                <FiBookmark />
                            </button>
                        )}
                    </div>
                </li>
            ))}
            </ul>
        </div>
    );
}

export default ReportCard;