import React from 'react';
import '../Dashboard.css';


const EmissionsCard: React.FC = ({}) => {

    return (
        <div className="report-card">
            <div className="report-header">
                <h3>Geral</h3>
                <div className="toggle-group">
                    <button>Dia</button>
                    <button className="active">Semana</button>
                    <button>Mês</button>
                    <button>Ano</button>
                </div>
            </div>
            <div className="emissions-gauge">
                <div className="gauge-circle">
                    <div className="gauge-inner">
                        <span className="percentage">x %</span>
                        <span className="label">Emissões</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmissionsCard;