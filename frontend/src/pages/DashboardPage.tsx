import MetricCard from '../components/MetricCard';
import { BsCalendarEvent } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

// --- Sub-componentes estáticos para o protótipo ---

const TimelineChart = () => (
  <div className="timeline-card">
    <div className="timeline-header">
      <h3>Timeline</h3>
      <div className="timeline-controls">
        <span className="date-picker"><BsCalendarEvent /> 10 de Outubro, 2025</span>
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

const EmissionsGauge = () => (
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

const QuickReportList = ({ title, items, unit, linkTo }: any) => (
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

// --- Componente Principal da Página ---

const DashboardPage = () => {

  // Dados mockados para as listas
  const historicoItems = [
    { linha: '874c-10', data: '21 Julho 2025', value: 'Bom', color: 'var(--accent-blue)' },
    { linha: '8705-10', data: '21 Julho 2025', value: 'Ruim', color: 'var(--accent-red)' },
    { linha: '8319-10', data: '21 Julho 2025', value: 'Moderado', color: 'var(--accent-yellow)' },
  ];

  const velocidadeItems = [
    { linha: '715M-10', data: '28 Julho 2025', value: '50', unit: 'km/h', color: 'var(--accent-blue)' },
    { linha: '875C-10', data: '22 Julho 2025', value: '30', unit: 'km/h', color: 'var(--accent-yellow)' },
    { linha: '8019-10', data: '22 Julho 2025', value: '35', unit: 'km/h', color: 'var(--accent-yellow)' },
  ];

  return (
    <>  

      <div className="dashboard-main">
        <div className="metric-cards-container">
          <MetricCard 
            icon="P" 
            iconColor="#6A66FF" 
            title="Pinheiros" 
            iqarValue={23} 
            iqarMax={90} 
            time="13h56min" 
          />
          <MetricCard 
            icon="CU" 
            iconColor="#3751FF" 
            title="Cid. Universitária" 
            iqarValue={85} 
            iqarMax={90} 
            time="6h" 
          />
          <MetricCard 
            icon="MT" 
            iconColor="#9E37FF" 
            title="Marg. Tietê" 
            iqarValue={9} 
            iqarMax={90} 
            time="17h45min" 
          />
        </div>
        <div className="main-chart-area">
          <TimelineChart />
        </div>
      </div>
      <div className="dashboard-right-navbar">
        <EmissionsGauge />
        <QuickReportList 
          title="Histórico de emissões" 
          items={historicoItems} 
          linkTo="/dashboard/historico" 
        />
        <QuickReportList 
          title="Velocidades médias" 
          items={velocidadeItems} 
          unit="km/h" 
          linkTo="/dashboard/comparativos" 
        />
      </div>
    </>
  );
};

export default DashboardPage;