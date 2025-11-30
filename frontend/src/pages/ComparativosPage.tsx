import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line as RechartsLine, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiSearch, FiX, FiBookmark } from 'react-icons/fi';
import '../style/Comparativos.css';
import { linesService } from '../services/linesService';
import { emissionsService } from '../services/emissionsService';
import type { Line } from '../types/api.types';
import Loading from '../components/Loading';
import SaveRouteModal from '../components/SaveRouteModal';

interface ComparisonData {
  lineId: number;
  lineName: string;
  lineCode: string;
  lineDirection?: 'MAIN' | 'SECONDARY';
  totalEmission: number;
  totalDistance: number;
  avgEmission: number;
}

interface HistoricalPoint {
  date: string;
  [key: string]: string | number;
}

const ComparativosPage = () => {
  const [daysRange, setDaysRange] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados do backend
  const [allLines, setAllLines] = useState<Line[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);

  // Buscar todas as linhas ao carregar
  useEffect(() => {
    async function loadLines() {
      try {
        setLoading(true);
        const linesData = await linesService.searchLines('');
        setAllLines(linesData); // Manter todas as linhas, incluindo ida e volta
      } catch (err) {
        console.error('Erro ao carregar linhas:', err);
        setError('Não foi possível carregar a lista de linhas.');
      } finally {
        setLoading(false);
      }
    }
    loadLines();
  }, []);

  // Buscar dados de comparação quando linhas ou período mudam
  useEffect(() => {
    if (selectedLines.length === 0) {
      setComparisonData([]);
      setHistoricalData([]);
      return;
    }

    async function fetchComparisonData() {
      try {
        setLoading(true);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysRange);
        const startDateStr = startDate.toISOString().split('T')[0];

        console.log('=== Iniciando fetchComparisonData ===');
        console.log('selectedLines:', selectedLines);
        console.log('allLines.length:', allLines.length);
        console.log('daysRange:', daysRange);

        // Buscar estatísticas para cada linha selecionada
        const promises = selectedLines.map(async (lineId) => {
          const line = allLines.find(l => l.id === lineId);
          console.log(`Linha encontrada para id ${lineId}:`, line);
          const lineCode = line?.name || `${lineId}`;
          const fullName = line?.description ? `${line.name} - ${line.description}` : (line?.name || `Linha ${lineId}`);
          
          try {
            // Tentar buscar dados históricos primeiro
            const stats = await emissionsService.getLineStatistics(lineId, startDateStr, daysRange);
            
            if (stats.length > 0) {
              const totalEmission = stats.reduce((acc, s) => acc + s.total_emission, 0);
              const totalDistance = stats.reduce((acc, s) => acc + s.total_distance, 0);
              
              return {
                lineId,
                lineName: fullName,
                lineCode,
                lineDirection: line?.direction,
                totalEmission,
                totalDistance,
                avgEmission: totalDistance > 0 ? totalEmission / totalDistance : 0,
              };
            }
          } catch (err) {
            console.log(`Sem dados históricos para linha ${lineCode}, calculando emissão total...`);
          }
          
          // Se não houver dados históricos, calcular emissão total da linha
          try {
            console.log(`Buscando emissão total para linha ${lineCode} (id: ${lineId})`);
            const totalEmissions = await emissionsService.getTotalLineEmission(lineCode);
            console.log(`Resposta getTotalLineEmission:`, totalEmissions);
            const lineEmission = totalEmissions.find(e => e.line.id === lineId);
            console.log(`Emissão encontrada para linha ${lineId}:`, lineEmission);
            
            if (lineEmission) {
              // Multiplicar por daysRange para simular dados do período
              const totalEmission = lineEmission.emission * daysRange;
              const totalDistance = lineEmission.distance * daysRange;
              
              console.log(`Calculado - Emissão: ${totalEmission}, Distância: ${totalDistance}`);
              
              return {
                lineId,
                lineName: fullName,
                lineCode,
                lineDirection: line?.direction,
                totalEmission,
                totalDistance,
                avgEmission: totalDistance > 0 ? totalEmission / totalDistance : 0,
              };
            } else {
              console.warn(`Linha ${lineId} não encontrada na resposta do backend`);
            }
          } catch (err) {
            console.error(`Erro ao calcular emissão para linha ${lineCode}:`, err);
          }
          
          // Retornar dados vazios se nenhum método funcionou
          return {
            lineId,
            lineName: fullName,
            lineCode,
            lineDirection: line?.direction,
            totalEmission: 0,
            totalDistance: 0,
            avgEmission: 0,
          };
        });

        const results = await Promise.all(promises);
        console.log('=== Resultados finais ===');
        console.log('comparisonData:', results);
        setComparisonData(results);

        // Montar dados históricos para o gráfico
        const statsPromises = selectedLines.map(async (lineId) => {
          try {
            const stats = await emissionsService.getLineStatistics(lineId, startDateStr, daysRange);
            if (stats.length > 0) {
              return { lineId, stats, hasHistorical: true };
            }
          } catch (err) {
            console.log(`Sem dados históricos para linha ${lineId}`);
          }
          
          // Se não houver dados históricos, simular com dados calculados
          const line = allLines.find(l => l.id === lineId);
          const lineCode = line?.name || `${lineId}`;
          
          try {
            const totalEmissions = await emissionsService.getTotalLineEmission(lineCode);
            const lineEmission = totalEmissions.find(e => e.line.id === lineId);
            
            if (lineEmission) {
              // Criar dados simulados distribuindo uniformemente ao longo do período
              const simulatedStats = [];
              for (let i = 0; i < daysRange; i++) {
                const date = new Date(startDateStr);
                date.setDate(date.getDate() + i);
                simulatedStats.push({
                  date: date.toISOString().split('T')[0],
                  total_emission: lineEmission.emission,
                  total_distance: lineEmission.distance,
                });
              }
              return { lineId, stats: simulatedStats, hasHistorical: false };
            }
          } catch (err) {
            console.error(`Erro ao simular dados para linha ${lineCode}:`, err);
          }
          
          return { lineId, stats: [], hasHistorical: false };
        });
        
        const allStatsResults = await Promise.all(statsPromises);
        
        // Organizar por data
        const dateMap = new Map<string, any>();
        allStatsResults.forEach((result) => {
          const lineId = result.lineId;
          const lineName = allLines.find(l => l.id === lineId)?.name || `L${lineId}`;
          
          result.stats.forEach(stat => {
            if (!dateMap.has(stat.date)) {
              dateMap.set(stat.date, { date: stat.date });
            }
            dateMap.get(stat.date)![lineName] = stat.total_emission;
          });
        });
        
        setHistoricalData(Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar dados de comparação:', err);
        setError('Erro ao carregar dados comparativos');
      } finally {
        setLoading(false);
      }
    }

    fetchComparisonData();
  }, [selectedLines, daysRange, allLines]);

  // Filtrar linhas disponíveis
  const filteredLines = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase().trim();
    return allLines.filter(line => {
      const lineCode = line.name.split(' - ')[0].toLowerCase();
      const fullName = line.name.toLowerCase();
      return (
        (lineCode.includes(term) || fullName.includes(term)) &&
        !selectedLines.includes(line.id)
      );
    });
  }, [searchTerm, selectedLines, allLines]);

  const handleAddLine = (lineId: number) => {
    if (selectedLines.length < 4) {
      setSelectedLines([...selectedLines, lineId]);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleRemoveLine = (lineId: number) => {
    setSelectedLines(selectedLines.filter(id => id !== lineId));
  };

  const getRouteColor = (index: number) => {
    const colors = ['#6A66FF', '#3751FF', '#9E37FF', '#FF6B6B'];
    return colors[index % colors.length];
  };

  const formatDate = (dateStr: string) => {
    return dateStr.slice(5); // MM-DD
  };

  if (loading && allLines.length === 0) {
    return <Loading />;
  }

  return (
    <div className="comparativos-container">
      <div className="comparativos-header">
        <h2>Dados Comparativos</h2>
        <div className="period-selector">
          <button 
            className={daysRange === 7 ? 'active' : ''}
            onClick={() => setDaysRange(7)}
          >
            7 dias
          </button>
          <button 
            className={daysRange === 30 ? 'active' : ''}
            onClick={() => setDaysRange(30)}
          >
            30 dias
          </button>
          <button 
            className={daysRange === 90 ? 'active' : ''}
            onClick={() => setDaysRange(90)}
          >
            90 dias
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#FFC0CB', 
          color: '#8B0000',
          borderRadius: 8,
          fontSize: '14px',
          margin: '0 0 1rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Busca de Linhas */}
      <div className="route-search-container">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar linha para comparar... (escolha no máx. 4 linhas)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredLines.length > 0) {
                handleAddLine(filteredLines[0].id);
              }
            }}
          />
          {showDropdown && filteredLines.length > 0 && (
            <div className="search-dropdown">
              {filteredLines.slice(0, 20).map((line) => {
                const fullName = line.description ? `${line.name} - ${line.description}` : line.name;
                return (
                  <div
                    key={line.id}
                    className="dropdown-item"
                    onClick={() => handleAddLine(line.id)}
                  >
                    {fullName}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="selected-routes">
          {selectedLines.map((lineId, index) => {
            const line = allLines.find(l => l.id === lineId);
            const fullName = line?.description ? `${line.name} - ${line.description}` : (line?.name || `${lineId}`);
            return (
              <div 
                key={lineId} 
                className="route-tag"
                style={{ borderColor: getRouteColor(index) }}
              >
                <span style={{ color: getRouteColor(index) }}>
                  {fullName}
                </span>
                <FiX 
                  className="remove-icon" 
                  onClick={() => handleRemoveLine(lineId)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {loading && selectedLines.length > 0 && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loading />
        </div>
      )}

      {/* Gráficos Comparativos */}
      {!loading && selectedLines.length > 0 && historicalData.length > 0 && (
        <div className="charts-section">
          <div className="chart-container">
            <h3>Emissões de CO₂ - Últimos {daysRange} Dias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9BA1AD" 
                  tickFormatter={formatDate}
                />
                <YAxis stroke="#9BA1AD" label={{ value: 'kg CO₂', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4e' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {selectedLines.map((lineId, index) => {
                  const lineName = allLines.find(l => l.id === lineId)?.name.split(' - ')[0] || `L${lineId}`;
                  return (
                    <RechartsLine
                      key={lineId}
                      type="monotone"
                      dataKey={lineName}
                      stroke={getRouteColor(index)}
                      strokeWidth={2}
                      dot={{ fill: getRouteColor(index), r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Comparação de Emissões Totais ({daysRange} dias)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="lineCode" stroke="#9BA1AD" />
                <YAxis stroke="#9BA1AD" label={{ value: 'kg CO₂', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4e' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar 
                  dataKey="totalEmission" 
                  fill="#FF6B6B" 
                  radius={[8, 8, 0, 0]}
                  name="Emissões Totais"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cards Individuais por Linha (dados do trajeto completo) */}
      {!loading && selectedLines.length > 0 && (
        <div className="comparativos-grid">
          {selectedLines.map((lineId, index) => {
            const line = allLines.find(l => l.id === lineId);
            const direction = line?.direction === 'MAIN' ? 'Ida' : 'Volta';
            const compData = comparisonData.find(c => c.lineId === lineId);
            
            // Dados do trajeto completo (dividir pelo daysRange para obter valores de um trajeto)
            const routeEmission = compData ? compData.totalEmission / daysRange : 0;
            const routeDistance = compData ? compData.totalDistance / daysRange : 0;
            const avgEmission = compData ? compData.avgEmission : 0;
            
            return (
            <div key={lineId} className="comparison-card">
              <div className="card-header">
                <div>
                  <h3 style={{ color: getRouteColor(index), margin: 0 }}>{line?.name || lineId}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#9BA1AD' }}>({direction}) - {line?.description}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="period-badge">Salve no histórico</span>
                  <button 
                    className="save-route-btn-comp"
                    onClick={() => {
                      setSelectedLineId(lineId);
                      setIsModalOpen(true);
                    }}
                    title="Salvar no histórico"
                  >
                    <FiBookmark />
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className="metric-item">
                  <span className="metric-label">Emissão do Trajeto</span>
                  <span className="metric-value">{routeEmission.toFixed(2)} kg CO₂</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Distância do Trajeto</span>
                  <span className="metric-value">{routeDistance.toFixed(2)} km</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Emissão Média</span>
                  <span className="metric-value">{avgEmission.toFixed(3)} kg/km</span>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Cards de Comparação do Período */}
      {!loading && comparisonData.length > 0 && (
        <>
          <h3 style={{ color: '#000000', marginTop: '2rem', marginBottom: '1rem' }}>Totais do Período ({daysRange} dias)</h3>
          <div className="comparativos-grid">
          {comparisonData.map((item, index) => {
            const direction = item.lineDirection === 'MAIN' ? 'Ida' : 'Volta';
            return (
            <div key={item.lineId} className="comparison-card">
              <div className="card-header">
                <div>
                  <h3 style={{ color: getRouteColor(index), margin: 0 }}>{item.lineCode}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#9BA1AD' }}>({direction})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="period-badge">{daysRange} dias</span>
                </div>
              </div>
              <div className="card-content">
                <div className="metric-item">
                  <span className="metric-label">Emissões Totais</span>
                  <span className="metric-value">{item.totalEmission.toFixed(2)} kg CO₂</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Distância Total</span>
                  <span className="metric-value">{item.totalDistance.toFixed(2)} km</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Emissões Médias</span>
                  <span className="metric-value">{item.avgEmission.toFixed(3)} kg/km</span>
                </div>
              </div>
            </div>
          );
          })}
          </div>
        </>
      )}

      {/* Resumo Geral */}
      {!loading && comparisonData.length > 1 && (
        <div className="comparativos-summary">
          <div className="summary-card">
            <h3>Resumo Comparativo ({daysRange} dias)</h3>
            <div className="summary-metrics">
              <div className="summary-item">
                <span>Emissões Totais</span>
                <strong>
                  {comparisonData.reduce((acc, item) => acc + item.totalEmission, 0).toFixed(2)} kg CO₂
                </strong>
              </div>
              <div className="summary-item">
                <span>Distância Total</span>
                <strong>
                  {comparisonData.reduce((acc, item) => acc + item.totalDistance, 0).toFixed(2)} km
                </strong>
              </div>
              <div className="summary-item">
                <span>Média Geral de Emissões</span>
                <strong>
                  {(comparisonData.reduce((acc, item) => acc + item.avgEmission, 0) / comparisonData.length).toFixed(3)} kg/km
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLines.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          color: '#9BA1AD'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '0.5rem' }}>
            Nenhuma linha selecionada para comparação
          </p>
          <p style={{ fontSize: '14px' }}>
            Use o campo de busca acima para adicionar linhas e comparar suas emissões
          </p>
        </div>
      )}

      <SaveRouteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLineId(null);
        }}
        onSaved={() => {
          setIsModalOpen(false);
          setSelectedLineId(null);
          alert('Rota salva com sucesso no histórico!');
        }}
        lineId={selectedLineId ?? undefined}
        lineName={comparisonData.find(item => item.lineId === selectedLineId)?.lineName}
      />
    </div>
  );
};

export default ComparativosPage;
