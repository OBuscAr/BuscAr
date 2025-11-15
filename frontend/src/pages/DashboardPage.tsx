import MetricCard from '../components/MetricCard';
import TimelineCard from '../components/TimelineCard';
import QuickReportCard from '../components/QuickReportCard';
import '../Dashboard.css';

// --- Sub-componentes estáticos para o protótipo ---

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
          <TimelineCard
            date='10 de fevereiro de 2026'
          />
        </div>
      </div>
      <div className="dashboard-right-navbar">
        <EmissionsGauge />
        <QuickReportCard 
          title="Histórico de emissões" 
          items={historicoItems}
          unit=''
          linkTo="/dashboard/historico" 
        />
        <QuickReportCard
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