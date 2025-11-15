import React from 'react';
import '../Dashboard.css';
import { BsCalendarEvent } from 'react-icons/bs';


type TimelineCardProps = {
  date: string;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ date }) => {


    return (
        <div className="timeline-card">
            <div className="timeline-header">
                <h3>Timeline</h3>
                <div className="timeline-controls">
                    <span className="date-picker"><BsCalendarEvent /> {date}</span>
                    <div className="toggle-group">
                        <button className="active">Dia</button>
                        <button>Semana</button>
                        <button>Mês</button>
                    </div>
                </div>
            </div>
            <div className="timeline-chart-placeholder">
                [Placeholder para o Gráfico de Linha (Emissões)]
                {/* Você pode adicionar uma biblioteca como Recharts ou Chart.js aqui */}
            </div>
        </div>
    );
}

export default TimelineCard;