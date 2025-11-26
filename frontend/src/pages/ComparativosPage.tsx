import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line as RechartsLine, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiSearch, FiX } from 'react-icons/fi';
import '../style/Comparativos.css';
import { linesService } from '../services/linesService';
import { emissionsService } from '../services/emissionsService';
import type { Line } from '../types/api.types';
import Loading from '../components/Loading';

interface ComparisonData {
  lineId: number;
  lineName: string;
  lineCode: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dados do backend
  const [allLines, setAllLines] = useState<Line[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);

  // Buscar todas as linhas ao carregar
  useEffect(() => {
    async function loadLines() {
      try {
        const lines = await linesService.searchLines();
        // Agrupar linhas por código, priorizando direção MAIN
        const uniqueLinesMap = new Map<string, Line>();
        lines.forEach(line => {
          const lineCode = line.name.split(' - ')[0];
          const existing = uniqueLinesMap.get(lineCode);
          // Se não existe ou a atual é MAIN, substitui
          if (!existing || line.direction === 'MAIN') {
            uniqueLinesMap.set(lineCode, line);
          }
        });
        const uniqueLines = Array.from(uniqueLinesMap.values());
        setAllLines(uniqueLines);
        // Selecionar as duas primeiras linhas por padrão
        if (uniqueLines.length >= 2) {
          setSelectedLines([uniqueLines[0].id, uniqueLines[1].id]);
        }
      } catch (err) {
        console.error('Erro ao buscar linhas:', err);
        setError('Erro ao carregar linhas disponíveis');
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

        // Buscar estatísticas para cada linha selecionada
        const promises = selectedLines.map(async (lineId) => {
          const stats = await emissionsService.getLineStatistics(lineId, startDateStr, daysRange);
          const line = allLines.find(l => l.id === lineId);
          const lineCode = line?.name.split(' - ')[0] || `${lineId}`;
          
          const totalEmission = stats.reduce((acc, s) => acc + s.total_emission, 0);
          const totalDistance = stats.reduce((acc, s) => acc + s.total_distance, 0);
          
          return {
            lineId,
            lineName: line?.name || `Linha ${lineId}`,
            lineCode,
            totalEmission,
            totalDistance,
            avgEmission: totalDistance > 0 ? totalEmission / totalDistance : 0,
          };
        });

        const results = await Promise.all(promises);
        setComparisonData(results);

        // Montar dados históricos para o gráfico
        const statsPromises = selectedLines.map(lineId => 
          emissionsService.getLineStatistics(lineId, startDateStr, daysRange)
        );
        const allStats = await Promise.all(statsPromises);
        
        // Organizar por data
        const dateMap = new Map<string, any>();
        allStats.forEach((stats, idx) => {
          const lineId = selectedLines[idx];
          const lineName = allLines.find(l => l.id === lineId)?.name.split(' - ')[0] || `L${lineId}`;
          
          stats.forEach(stat => {
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
              {filteredLines.slice(0, 10).map((line) => {
                const lineCode = line.name.split(' - ')[0];
                const lineName = line.name.split(' - ').slice(1).join(' - ');
                return (
                  <div
                    key={line.id}
                    className="dropdown-item"
                    onClick={() => handleAddLine(line.id)}
                  >
                    <strong>{lineCode}</strong> - {lineName}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="selected-routes">
          {selectedLines.map((lineId, index) => {
            const line = allLines.find(l => l.id === lineId);
            const lineCode = line?.name.split(' - ')[0] || `${lineId}`;
            return (
              <div 
                key={lineId} 
                className="route-tag"
                style={{ borderColor: getRouteColor(index) }}
              >
                <span style={{ color: getRouteColor(index) }}>
                  {lineCode}
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

      {/* Cards de Comparação */}
      {!loading && comparisonData.length > 0 && (
        <div className="comparativos-grid">
          {comparisonData.map((item, index) => (
            <div key={item.lineId} className="comparison-card">
              <div className="card-header">
                <h3 style={{ color: getRouteColor(index) }}>{item.lineCode}</h3>
                <span className="period-badge">{daysRange} dias</span>
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
          ))}
        </div>
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
    </div>
  );
};

export default ComparativosPage;
