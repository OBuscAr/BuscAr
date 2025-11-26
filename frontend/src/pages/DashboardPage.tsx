import { lazy, Suspense, useEffect, useState } from 'react';
import Loading from '../components/Loading';
import '../style/Dashboard.css';
import { emissionsService } from '../services/emissionsService';
import type { EmissionStatistics, LineEmission } from '../types/api.types';

const MetricCard = lazy(() => import('../components/MetricCard'));
const TimelineCard = lazy(() => import('../components/TimelineCard'));
const ReportCard = lazy(() => import('../components/ReportCard'));
const EmissionsCard = lazy(() => import('../components/EmissionsCard'));

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<EmissionStatistics[]>([]);
  const [topLines, setTopLines] = useState<LineEmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [daysRange, setDaysRange] = useState(7);
  const [startDate, setStartDate] = useState(() => {
    // Iniciar com 7 dias atrás para evitar problemas com datas futuras
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo.toISOString().split('T')[0];
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Buscar estatísticas dos últimos X dias
        const statsData = await emissionsService.getOverallStatistics(startDate, daysRange);
        setStatistics(statsData);
        // Buscar ranking das linhas mais poluentes de hoje
        const rankingData = await emissionsService.getLinesRanking(startDate, 1, 5);
        setTopLines(rankingData.lines_emissions);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [daysRange, startDate]);

  // Formatar dados para os cards de relatório
  const getEmissionColor = (emission: number): string => {
    if (emission < 100) return 'var(--accent-blue)';
    if (emission < 200) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const historicoItems = topLines.length > 0 
    ? topLines.slice(0, 3).map(item => {
        // Extrair número da linha do nome (formato: "874C-10 - NOME DA LINHA")
        const lineNumber = item.line.name.split(' - ')[0];
        return {
          linha: lineNumber,
          data: formatDate(new Date().toISOString().split('T')[0]),
          value: `${item.emission.toFixed(2)} kg`,
          color: getEmissionColor(item.emission),
        };
      })
    : [
        { linha: '874c-10', data: '21 Julho 2025', value: 'Sem dados', color: 'var(--accent-blue)' },
        { linha: '8705-10', data: '21 Julho 2025', value: 'Sem dados', color: 'var(--accent-red)' },
        { linha: '8319-10', data: '21 Julho 2025', value: 'Sem dados', color: 'var(--accent-yellow)' },
      ];

  // Dados mockados para velocidades médias (ainda não disponível na API)
  const velocidadeItems = [
    { linha: '715M-10', data: '28 Julho 2025', value: '50', unit: 'km/h', color: 'var(--accent-blue)' },
    { linha: '875C-10', data: '22 Julho 2025', value: '30', unit: 'km/h', color: 'var(--accent-yellow)' },
    { linha: '8019-10', data: '22 Julho 2025', value: '35', unit: 'km/h', color: 'var(--accent-yellow)' },
  ];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Gráfico simples de emissões
  const emissionChartPoints = statistics.length > 1 
    ? statistics.map((stat, idx) => {
        const x = (idx / (statistics.length - 1)) * 400;
        // Normalizar para altura do gráfico (máx 200)
        const maxEmission = Math.max(...statistics.map(s => s.total_emission), 1);
        const y = 200 - (stat.total_emission / maxEmission) * 180;
        return `${x},${y}`;
      }).join(' ')
    : '0,100';

  const noData = topLines.length === 0 && statistics.length === 0;

  return (
    <>
      {noData && (
        <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#FFF3CD', 
          color: '#856404',
          borderRadius: 8,
          fontSize: '14px',
          border: '1px solid #FFEAA7',
          margin: '0 2rem 1rem',
          width: 'fit-content'
        }}>
          ⚠️ Banco de dados vazio. Importe dados para visualizar estatísticas.
        </div>
      )}
      <Suspense fallback={<Loading />}>
        <div className="dashboard-main">
          <div className="metric-cards-container">
            {topLines.length > 0 ? (
              topLines.slice(0, 3).map((lineData, index) => {
                // Extrair número da linha do nome (formato: "874C-10 - NOME DA LINHA")
                const lineNumber = lineData.line.name.split(' - ')[0];
                const lineName = lineData.line.name.split(' - ').slice(1).join(' - ') || lineData.line.name;
                return (
                  <MetricCard 
                    key={lineData.line.id}
                    icon={lineNumber.substring(0, 2)} 
                    iconColor={index === 0 ? "#6A66FF" : index === 1 ? "#3751FF" : "#9E37FF"} 
                    title={lineName} 
                    iqarValue={Math.round(lineData.emission)} 
                    iqarMax={Math.max(...topLines.map(l => l.emission))} 
                    time={formatDate(new Date().toISOString().split('T')[0])}
                  />
                );
              })
            ) : (
              <>
                <MetricCard 
                  icon="P" 
                  iconColor="#6A66FF" 
                  title="Sem dados" 
                  iqarValue={0} 
                  iqarMax={100} 
                  time="--" 
                />
                <MetricCard 
                  icon="CU" 
                  iconColor="#3751FF" 
                  title="Sem dados" 
                  iqarValue={0} 
                  iqarMax={100} 
                  time="--" 
                />
                <MetricCard 
                  icon="MT" 
                  iconColor="#9E37FF" 
                  title="Sem dados" 
                  iqarValue={0} 
                  iqarMax={100} 
                  time="--" 
                />
              </>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            marginBottom: 16,
            marginTop: 8
          }}>
            <label htmlFor="daysRange" style={{ fontWeight: 500, color: 'var(--text-dark)' }}>Período:</label>
            <select
              id="daysRange"
              value={daysRange}
              onChange={e => setDaysRange(Number(e.target.value))}
              style={{ 
                padding: '8px 16px', 
                borderRadius: 8, 
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
            </select>
            <label htmlFor="startDate" style={{ fontWeight: 500, color: 'var(--text-dark)' }}>Data inicial:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setStartDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div className="timeline-card-container">
            <TimelineCard
              date={formatDate(new Date().toISOString().split('T')[0])}
            />
            {/* Gráfico de emissões */}
            {statistics.length > 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 24, marginTop: 24 }}>
                <h3 style={{ marginBottom: 16, fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>Emissões totais ({daysRange} dias)</h3>
                <svg width="100%" height={220} viewBox="0 0 420 220" style={{ background: '#f9fafb', borderRadius: 8 }}>
                  <polyline
                    points={emissionChartPoints}
                    fill="none"
                    stroke="#6A66FF"
                    strokeWidth={3}
                  />
                  {/* Eixos */}
                  <line x1={10} y1={200} x2={410} y2={200} stroke="#bbb" strokeWidth={1} />
                  <line x1={10} y1={20} x2={10} y2={200} stroke="#bbb" strokeWidth={1} />
                  {/* Labels de datas */}
                  {statistics.map((stat, idx) => {
                    const x = statistics.length > 1 
                      ? (idx / (statistics.length - 1)) * 400 + 10 
                      : 210;
                    return (
                      <text
                        key={stat.date}
                        x={x}
                        y={215}
                        fontSize={10}
                        textAnchor="middle"
                        fill="#888"
                      >
                        {stat.date.slice(5)}
                      </text>
                    );
                  })}
                  {/* Labels de valores */}
                  <text x={15} y={30} fontSize={12} fill="#888">Máx: {Math.max(...statistics.map(s => s.total_emission)).toFixed(2)} kg</text>
                  <text x={15} y={195} fontSize={12} fill="#888">0</text>
                </svg>
              </div>
            ) : (
              <div style={{ 
                background: '#fff', 
                borderRadius: 12, 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                padding: 24, 
                marginTop: 24,
                textAlign: 'center',
                color: '#888'
              }}>
                <h3 style={{ marginBottom: 16, fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>Emissões totais ({daysRange} dias)</h3>
                <div style={{ padding: '60px 0', fontSize: '14px' }}>
                  [Placeholder para o Gráfico de Linha (Emissões)]<br/>
                  <small style={{ fontSize: '12px', color: '#aaa' }}>Aguardando dados...</small>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-sidebar">
          <EmissionsCard />
          <ReportCard 
            title="Histórico de emissões" 
            items={historicoItems}
            unit=''
            linkTo="/painel/historico" 
            />
          <ReportCard
            title="Velocidades médias" 
            items={velocidadeItems} 
            unit="km/h" 
            linkTo="/painel/comparativos" 
            />
        </div>
      </Suspense>
    </>
  );
};

export default DashboardPage;