import { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import '../style/Dashboard.css';
import { emissionsService } from '../services/emissionsService';
import { routesService } from '../services/routesService';
import type { EmissionStatistics, LineEmission } from '../types/api.types';
import type { UserRoute } from '../services/routesService';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<EmissionStatistics[]>([]);
  const [topLines, setTopLines] = useState<LineEmission[]>([]);
  const [userRoutes, setUserRoutes] = useState<UserRoute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [daysRange, setDaysRange] = useState(7);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const today = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysRange);
        const startDateStr = startDate.toISOString().split('T')[0];

        // Buscar rotas do usuário primeiro
        const routesData = await routesService.getRoutes().catch(() => []);
        setUserRoutes(routesData);

        // Se o usuário não tem rotas, mostrar ranking global
        if (routesData.length === 0) {
          const [statsData, rankingData] = await Promise.all([
            emissionsService.getOverallStatistics(startDateStr, daysRange).catch(() => []),
            emissionsService.getLinesRanking(today, 1, 10).catch(() => ({ lines_emissions: [], total_pages: 0 })),
          ]);
          setStatistics(statsData);
          setTopLines(rankingData.lines_emissions);
        } else {
          // Usuário tem rotas: agrupar por data de criação
          console.log('📊 Dashboard - Rotas recebidas:', routesData.length);
          console.log('📊 Período:', startDateStr, 'até', today);
          
          const aggregatedStats: { [date: string]: { emission: number; distance: number } } = {};
          
          routesData.forEach(route => {
            // Pegar apenas a data (sem hora) do created_at
            const routeDate = route.created_at.split('T')[0];
            
            console.log(`🔍 Rota ${route.id}: date=${routeDate}, emission=${route.emission}, distance=${route.distance}`);
            
            // Filtrar apenas rotas dentro do período selecionado
            if (routeDate >= startDateStr && routeDate <= today) {
              if (!aggregatedStats[routeDate]) {
                aggregatedStats[routeDate] = { emission: 0, distance: 0 };
              }
              aggregatedStats[routeDate].emission += route.emission;
              aggregatedStats[routeDate].distance += route.distance;
              console.log(`✅ Incluída! Total da data ${routeDate}:`, aggregatedStats[routeDate]);
            } else {
              console.log(`❌ Fora do período (${routeDate} não está entre ${startDateStr} e ${today})`);
            }
          });

          console.log('📈 Estatísticas agregadas:', aggregatedStats);

          // Converter para array e ordenar por data
          const userStats = Object.entries(aggregatedStats)
            .map(([date, data]) => ({
              date,
              total_emission: data.emission,
              total_distance: data.distance
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

          console.log('📊 Stats finais:', userStats);
          setStatistics(userStats);
          setTopLines([]); // Não mostrar ranking global para usuário com rotas
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [daysRange]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Cálculos de métricas gerais
  const totalEmissions = statistics.reduce((sum, stat) => sum + stat.total_emission, 0);
  const avgDailyEmission = statistics.length > 0 ? totalEmissions / statistics.length : 0;
  const totalDistance = statistics.reduce((sum, stat) => sum + stat.total_distance, 0);
  const totalSavings = userRoutes.reduce((sum, route) => sum + route.emission_saving, 0);
  
  console.log('💯 Métricas calculadas:', {
    totalEmissions,
    avgDailyEmission,
    totalDistanceKm: totalDistance.toFixed(1),
    totalSavings,
    statisticsCount: statistics.length,
    routesCount: userRoutes.length
  });
  
  // Tendência de emissões (comparar primeira e última semana)
  const emissionTrend = statistics.length > 1 
    ? ((statistics[statistics.length - 1].total_emission - statistics[0].total_emission) / statistics[0].total_emission) * 100
    : 0;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#e74c3c',
        backgroundColor: '#fee',
        borderRadius: 12,
        margin: '2rem'
      }}>
        ⚠️ {error}
      </div>
    );
  }

  const noData = topLines.length === 0 && statistics.length === 0;

  return (
    <Suspense fallback={<Loading />}>
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header do Dashboard */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>
            {userRoutes.length > 0 ? 'Meu Dashboard' : 'Dashboard de Emissões'}
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {userRoutes.length > 0 
              ? `Suas estatísticas personalizadas com base em ${userRoutes.length} ${userRoutes.length === 1 ? 'rota salva' : 'rotas salvas'}`
              : 'Salve rotas para ver suas estatísticas personalizadas'}
          </p>
        </div>

        {noData && userRoutes.length === 0 && (
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#dbeafe', 
            color: '#1e40af',
            borderRadius: 12,
            fontSize: '14px',
            border: '1px solid #93c5fd',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '24px' }}>💡</span>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Comece salvando suas rotas!</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Você ainda não tem rotas salvas. Vá para <strong>Fotografias da Frota</strong> e salve suas rotas frequentes 
              para ver estatísticas personalizadas de emissões e economia de CO₂.
            </p>
            <button
              onClick={() => navigate('/painel/fotografias')}
              style={{ 
                padding: '12px 20px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              🔍 Buscar Rotas
            </button>
          </div>
        )}

        {/* Controle de período */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          marginBottom: '2rem',
          backgroundColor: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <label htmlFor="daysRange" style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '14px' }}>
            Período de análise:
          </label>
          <select
            id="daysRange"
            value={daysRange}
            onChange={e => setDaysRange(Number(e.target.value))}
            style={{ 
              padding: '10px 16px', 
              borderRadius: 8, 
              border: '2px solid #e0e0e0',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#1a1a1a',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </div>

        {/* Cards de métricas principais */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Total de Emissões */}
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                backgroundColor: '#fee2e2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🏭
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: emissionTrend > 0 ? '#ef4444' : '#10b981',
                backgroundColor: emissionTrend > 0 ? '#fee2e2' : '#d1fae5',
                padding: '4px 8px',
                borderRadius: 6
              }}>
                {emissionTrend > 0 ? '↑' : '↓'} {Math.abs(emissionTrend).toFixed(1)}%
              </span>
            </div>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem', fontWeight: 500 }}>
              {userRoutes.length > 0 ? 'Suas Emissões' : 'Emissões Totais'}
            </h3>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>
              {totalEmissions.toFixed(1)}
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#666', marginLeft: '0.5rem' }}>kg</span>
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              {userRoutes.length > 0 ? `Suas rotas nos últimos ${daysRange} dias` : `Período de ${daysRange} dias`}
            </p>
          </div>

          {/* Média Diária */}
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                backgroundColor: '#dbeafe', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                📊
              </div>
            </div>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem', fontWeight: 500 }}>
              Média Diária
            </h3>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>
              {avgDailyEmission.toFixed(1)}
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#666', marginLeft: '0.5rem' }}>kg/dia</span>
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              CO₂ emitido por dia
            </p>
          </div>

          {/* Distância Total */}
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                backgroundColor: '#fef3c7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🚌
              </div>
            </div>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem', fontWeight: 500 }}>
              {userRoutes.length > 0 ? 'Sua Distância' : 'Distância Percorrida'}
            </h3>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>
              {totalDistance.toFixed(1)}
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#666', marginLeft: '0.5rem' }}>km</span>
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              {userRoutes.length > 0 ? `Nas suas rotas (${statistics.length} dias)` : `Total de ${statistics.length} dias`}
            </p>
          </div>

          {/* Economia de CO₂ */}
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                backgroundColor: '#d1fae5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🌱
              </div>
            </div>
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem', fontWeight: 500 }}>
              Suas Economias
            </h3>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>
              {totalSavings.toFixed(1)}
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#666', marginLeft: '0.5rem' }}>kg</span>
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              {userRoutes.length} rotas salvas
            </p>
          </div>
        </div>

        {/* Grid principal - Gráfico e Ranking */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 400px)', 
          gap: '1.5rem', 
          marginBottom: '2rem',
        }}
        className="dashboard-grid-responsive"
        >
          {/* Gráfico de Emissões */}
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a', marginBottom: '1.5rem' }}>
              {userRoutes.length > 0 ? 'Suas Emissões ao Longo do Tempo' : 'Tendência de Emissões'}
            </h3>
            {statistics.length > 0 ? (
              <div style={{ position: 'relative', height: '300px' }}>
                <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid horizontal */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1={60}
                      y1={40 + i * 60}
                      x2={580}
                      y2={40 + i * 60}
                      stroke="#f0f0f0"
                      strokeWidth={1}
                    />
                  ))}
                  
                  {/* Área preenchida */}
                  {statistics.length > 1 && (() => {
                    const maxEmission = Math.max(...statistics.map(s => s.total_emission), 1);
                    const points = statistics.map((stat, idx) => {
                      const x = 60 + (idx / (statistics.length - 1)) * 520;
                      const y = 280 - (stat.total_emission / maxEmission) * 240;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <>
                        <polygon
                          points={`60,280 ${points} ${60 + 520},280`}
                          fill="url(#lineGradient)"
                        />
                        <polyline
                          points={points}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Pontos */}
                        {statistics.map((stat, idx) => {
                          const x = 60 + (idx / (statistics.length - 1)) * 520;
                          const y = 280 - (stat.total_emission / maxEmission) * 240;
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r={4}
                              fill="#fff"
                              stroke="#6366f1"
                              strokeWidth={3}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                  
                  {/* Eixo Y - Labels */}
                  {statistics.length > 0 && (() => {
                    const maxEmission = Math.max(...statistics.map(s => s.total_emission), 1);
                    return [0, 1, 2, 3, 4].map(i => {
                      const value = maxEmission * (1 - i / 4);
                      return (
                        <text
                          key={i}
                          x={50}
                          y={40 + i * 60}
                          fontSize={12}
                          textAnchor="end"
                          fill="#999"
                          dominantBaseline="middle"
                        >
                          {value.toFixed(0)}
                        </text>
                      );
                    });
                  })()}
                  
                  {/* Eixo X - Datas */}
                  {statistics.map((stat, idx) => {
                    if (statistics.length <= 7 || idx % Math.ceil(statistics.length / 7) === 0 || idx === statistics.length - 1) {
                      const x = statistics.length > 1 
                        ? 60 + (idx / (statistics.length - 1)) * 520
                        : 320;
                      return (
                        <text
                          key={stat.date}
                          x={x}
                          y={295}
                          fontSize={11}
                          textAnchor="middle"
                          fill="#999"
                        >
                          {new Date(stat.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </text>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            ) : (
              <div style={{ 
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                color: '#999',
                fontSize: '14px'
              }}>
                Sem dados para exibir no período selecionado
              </div>
            )}
          </div>

          {/* Ranking de Linhas ou Minhas Linhas */}
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
                {userRoutes.length > 0 ? 'Suas Linhas' : 'Top 10 Linhas'}
              </h3>
              <span style={{ fontSize: '12px', color: '#999' }}>
                {userRoutes.length > 0 ? `${userRoutes.length} ${userRoutes.length === 1 ? 'rota' : 'rotas'}` : 'Hoje'}
              </span>
            </div>
            {userRoutes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {userRoutes.slice(0, 10).map((route, index) => {
                  const lineNumber = route.line.name.split(' - ')[0];
                  const maxEmission = Math.max(...userRoutes.map(r => r.emission), 1);
                  const percentage = (route.emission / maxEmission) * 100;
                  
                  return (
                    <div 
                      key={route.id}
                      style={{ 
                        padding: '0.75rem',
                        backgroundColor: index < 3 ? '#dcfce7' : '#f9fafb',
                        borderRadius: 10,
                        border: index < 3 ? '1px solid #10b981' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => navigate('/painel/historico')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8,
                          backgroundColor: index < 3 ? '#10b981' : '#6366f1',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '2px' }}>
                            {lineNumber}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {route.emission.toFixed(2)} kg CO₂
                          </div>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div style={{ 
                        width: '100%', 
                        height: 6, 
                        backgroundColor: '#e5e7eb', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          backgroundColor: index < 3 ? '#10b981' : '#6366f1',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : topLines.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {topLines.map((line, index) => {
                  const lineNumber = line.line.name.split(' - ')[0];
                  const maxEmission = topLines[0].emission;
                  const percentage = (line.emission / maxEmission) * 100;
                  
                  return (
                    <div 
                      key={line.line.id}
                      style={{ 
                        padding: '0.75rem',
                        backgroundColor: index < 3 ? '#fef3c7' : '#f9fafb',
                        borderRadius: 10,
                        border: index < 3 ? '1px solid #fbbf24' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => navigate('/painel/fotografias')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8,
                          backgroundColor: index < 3 ? '#fbbf24' : '#6366f1',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '2px' }}>
                            {lineNumber}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {line.emission.toFixed(2)} kg CO₂
                          </div>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div style={{ 
                        width: '100%', 
                        height: 6, 
                        backgroundColor: '#e5e7eb', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          backgroundColor: index < 3 ? '#fbbf24' : '#6366f1',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                color: '#999',
                fontSize: '14px'
              }}>
                Nenhuma linha encontrada
              </div>
            )}
          </div>
        </div>

        {/* Minhas Rotas Salvas */}
        {userRoutes.length > 0 && (
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
                Minhas Rotas Salvas
              </h3>
              <button
                onClick={() => navigate('/painel/historico')}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                Ver todas →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {userRoutes.slice(0, 3).map((route) => (
                <div
                  key={route.id}
                  style={{ 
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.5rem' }}>
                    {route.line.name.split(' - ')[0]}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.75rem' }}>
                    {route.departure_stop.name} → {route.arrival_stop.name}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '12px' }}>
                    <span style={{ color: '#ef4444' }}>
                      🏭 {route.emission.toFixed(2)} kg
                    </span>
                    <span style={{ color: '#10b981' }}>
                      🌱 -{route.emission_saving.toFixed(2)} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links rápidos */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => navigate('/painel/fotografias')}
            style={{ 
              padding: '1.25rem',
              backgroundColor: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a1a1a',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            📸 Fotografias da Frota
          </button>
          
          <button
            onClick={() => navigate('/painel/historico')}
            style={{ 
              padding: '1.25rem',
              backgroundColor: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a1a1a',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            📊 Histórico de Emissões
          </button>
          
          <button
            onClick={() => navigate('/painel/comparativos')}
            style={{ 
              padding: '1.25rem',
              backgroundColor: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a1a1a',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔄 Dados Comparativos
          </button>
        </div>
      </div>
    </Suspense>
  );
};

export default DashboardPage;