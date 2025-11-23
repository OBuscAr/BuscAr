import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiSearch, FiX } from 'react-icons/fi';
import '../style/Comparativos.css';

interface ComparisonData {
  linha: string;
  velocidadeMedia: number;
  emissoes: number;
  iqar: string;
  periodo: string;
}

interface RouteOption {
  id: string;
  nome: string;
}

const ComparativosPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'semana' | 'mes' | 'ano'>('semana');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(['874C-10', '8705-10']);
  const [showDropdown, setShowDropdown] = useState(false);

  // Todas as rotas disponíveis
  const allRoutes: RouteOption[] = [
    { id: '874C-10', nome: 'Linha 874C-10' },
    { id: '8705-10', nome: 'Linha 8705-10' },
    { id: '8319-10', nome: 'Linha 8319-10' },
    { id: '715M-10', nome: 'Linha 715M-10' },
    { id: '875C-10', nome: 'Linha 875C-10' },
    { id: '8019-10', nome: 'Linha 8019-10' },
  ];

  // Dados mockados para comparação
  const allComparisonData: ComparisonData[] = [
    { linha: '874C-10', velocidadeMedia: 45, emissoes: 120, iqar: 'Bom', periodo: '7 dias' },
    { linha: '8705-10', velocidadeMedia: 28, emissoes: 180, iqar: 'Ruim', periodo: '7 dias' },
    { linha: '8319-10', velocidadeMedia: 35, emissoes: 150, iqar: 'Moderado', periodo: '7 dias' },
    { linha: '715M-10', velocidadeMedia: 50, emissoes: 110, iqar: 'Bom', periodo: '7 dias' },
    { linha: '875C-10', velocidadeMedia: 30, emissoes: 165, iqar: 'Moderado', periodo: '7 dias' },
    { linha: '8019-10', velocidadeMedia: 35, emissoes: 155, iqar: 'Moderado', periodo: '7 dias' },
  ];

  // Dados para gráfico de linha (histórico temporal)
  const historicalData = [
    { dia: 'Seg', '874C-10': 42, '8705-10': 25, '8319-10': 33, '715M-10': 48, '875C-10': 28, '8019-10': 32 },
    { dia: 'Ter', '874C-10': 44, '8705-10': 27, '8319-10': 35, '715M-10': 49, '875C-10': 29, '8019-10': 34 },
    { dia: 'Qua', '874C-10': 43, '8705-10': 26, '8319-10': 34, '715M-10': 51, '875C-10': 31, '8019-10': 35 },
    { dia: 'Qui', '874C-10': 46, '8705-10': 29, '8319-10': 36, '715M-10': 50, '875C-10': 30, '8019-10': 36 },
    { dia: 'Sex', '874C-10': 45, '8705-10': 28, '8319-10': 35, '715M-10': 50, '875C-10': 30, '8019-10': 35 },
  ];

  // Filtrar dados baseado nas rotas selecionadas
  const comparisonData = useMemo(() => {
    return allComparisonData.filter(data => selectedRoutes.includes(data.linha));
  }, [selectedRoutes]);

  // Filtrar rotas disponíveis
  const filteredRoutes = useMemo(() => {
    return allRoutes.filter(route => 
      route.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedRoutes.includes(route.id)
    );
  }, [searchTerm, selectedRoutes]);

  const handleAddRoute = (routeId: string) => {
    if (selectedRoutes.length < 4) {
      setSelectedRoutes([...selectedRoutes, routeId]);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleRemoveRoute = (routeId: string) => {
    setSelectedRoutes(selectedRoutes.filter(id => id !== routeId));
  };

  const getRouteColor = (index: number) => {
    const colors = ['#6A66FF', '#3751FF', '#9E37FF', '#FF6B6B'];
    return colors[index % colors.length];
  };

  const getIqarColor = (iqar: string) => {
    switch (iqar.toLowerCase()) {
      case 'bom': return 'var(--accent-blue)';
      case 'moderado': return 'var(--accent-yellow)';
      case 'ruim': return 'var(--accent-red)';
      default: return 'var(--text-light)';
    }
  };

  return (
    <div className="comparativos-container">
      <div className="comparativos-header">
        <h2>Dados Comparativos</h2>
        <div className="period-selector">
          <button 
            className={selectedPeriod === 'semana' ? 'active' : ''}
            onClick={() => setSelectedPeriod('semana')}
          >
            Semana
          </button>
          <button 
            className={selectedPeriod === 'mes' ? 'active' : ''}
            onClick={() => setSelectedPeriod('mes')}
          >
            Mês
          </button>
          <button 
            className={selectedPeriod === 'ano' ? 'active' : ''}
            onClick={() => setSelectedPeriod('ano')}
          >
            Ano
          </button>
        </div>
      </div>

      {/* Busca de Rotas */}
      <div className="route-search-container">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar linha para comparar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          {showDropdown && filteredRoutes.length > 0 && (
            <div className="search-dropdown">
              {filteredRoutes.map((route) => (
                <div
                  key={route.id}
                  className="dropdown-item"
                  onClick={() => handleAddRoute(route.id)}
                >
                  {route.nome}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="selected-routes">
          {selectedRoutes.map((routeId, index) => (
            <div 
              key={routeId} 
              className="route-tag"
              style={{ borderColor: getRouteColor(index) }}
            >
              <span style={{ color: getRouteColor(index) }}>
                Linha {routeId}
              </span>
              <FiX 
                className="remove-icon" 
                onClick={() => handleRemoveRoute(routeId)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos Comparativos */}
      {selectedRoutes.length > 0 && (
        <div className="charts-section">
          <div className="chart-container">
            <h3>Velocidade Média - Últimos 5 Dias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="dia" stroke="#9BA1AD" />
                <YAxis stroke="#9BA1AD" label={{ value: 'km/h', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4e' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {selectedRoutes.map((routeId, index) => (
                  <Line
                    key={routeId}
                    type="monotone"
                    dataKey={routeId}
                    stroke={getRouteColor(index)}
                    strokeWidth={2}
                    dot={{ fill: getRouteColor(index), r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Comparação de Emissões CO₂</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="linha" stroke="#9BA1AD" />
                <YAxis stroke="#9BA1AD" label={{ value: 'g/km', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4e' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar 
                  dataKey="emissoes" 
                  fill="#FF6B6B" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cards de Comparação */}
      <div className="comparativos-grid">
        {comparisonData.map((item, index) => (
          <div key={index} className="comparison-card">
            <div className="card-header">
              <h3 style={{ color: getRouteColor(index) }}>Linha {item.linha}</h3>
              <span className="period-badge">{item.periodo}</span>
            </div>
            <div className="card-content">
              <div className="metric-item">
                <span className="metric-label">Velocidade Média</span>
                <span className="metric-value">{item.velocidadeMedia} km/h</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Emissões CO₂</span>
                <span className="metric-value">{item.emissoes} g/km</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Qualidade do Ar</span>
                <span 
                  className="metric-value iqar-badge" 
                  style={{ color: getIqarColor(item.iqar) }}
                >
                  {item.iqar}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo Geral */}
      {comparisonData.length > 0 && (
        <div className="comparativos-summary">
          <div className="summary-card">
            <h3>Média Geral das Rotas Selecionadas</h3>
            <div className="summary-metrics">
              <div className="summary-item">
                <span>Velocidade Média</span>
                <strong>
                  {(comparisonData.reduce((acc, item) => acc + item.velocidadeMedia, 0) / comparisonData.length).toFixed(1)} km/h
                </strong>
              </div>
              <div className="summary-item">
                <span>Emissões Médias</span>
                <strong>
                  {(comparisonData.reduce((acc, item) => acc + item.emissoes, 0) / comparisonData.length).toFixed(1)} g/km
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparativosPage;
