import React, { useState, useEffect } from 'react';
import '../style/FleetPhotosPage.css';
import { FiSearch, FiMapPin, FiTrendingUp, FiCalendar, FiSave, FiDownload } from 'react-icons/fi';
import RouteMap from '../components/RouteMap';
import { linesService } from '../services/linesService';
import { emissionsService } from '../services/emissionsService';
import type { Line } from '../types/api.types';
import Loading from '../components/Loading';

interface RouteSegment {
  type: 'WALK' | 'BUS';
  instruction: string;
  distance_km: number;
  duration_text: string | null;
  line_name: string | null;
  line_color: string | null;
  vehicle_type: string | null;
  polyline: {
    encodedPolyline: string;
  };
}

interface RouteOption {
  description: string;
  distance_km: number;
  emission_kg_co2: number;
  polyline: {
    encodedPolyline: string;
  };
  segments: RouteSegment[];
}

interface RouteComparisonResponse {
  routes: RouteOption[];
}

interface PhotoData {
  id: string;
  linha: string;
  lineNumber: string;
  velocidadeMedia: number;
  emissaoCarbono: number;
  distancia: number;
  iqar: number;
  data: string;
}

interface SavedPhoto {
  id: string;
  linha: string;
  velocidade: string;
  data: string;
  thumbnail: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
  value?: number;
}

function FleetPhotosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [allLines, setAllLines] = useState<Line[]>([]);
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'line' | 'route'>('line');
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState<'velocidade' | 'emissao' | 'iqar'>('velocidade');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;

  // Carregar todas as linhas ao iniciar
  useEffect(() => {
    async function loadLines() {
      try {
        const lines = await linesService.searchLines('');
        setAllLines(lines);
      } catch (err) {
        console.error('Erro ao carregar linhas:', err);
      }
    }
    loadLines();
  }, []);

  // Filtrar linhas conforme o usuário digita
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const term = searchQuery.toLowerCase().trim();
      const filtered = allLines.filter(line => {
        const lineCode = line.name.toLowerCase();
        const description = line.description?.toLowerCase() || '';
        return lineCode.includes(term) || description.includes(term);
      }).slice(0, 10); // Limitar a 10 sugestões
      setFilteredLines(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredLines([]);
    }
  }, [searchQuery, allLines]);

  // Pontos de rota de exemplo (São Paulo - ajuste conforme necessário)
  const routePoints: RoutePoint[] = [
    { lat: -23.5505, lng: -46.6333, name: 'Terminal Pinheiros', value: 40 },
    { lat: -23.5489, lng: -46.6388, name: 'Av. Rebouças', value: 45 },
    { lat: -23.5470, lng: -46.6450, name: 'Av. Paulista', value: 35 },
    { lat: -23.5440, lng: -46.6520, name: 'Consolação', value: 38 },
    { lat: -23.5400, lng: -46.6580, name: 'Centro', value: 42 },
    { lat: -23.5350, lng: -46.6620, name: 'República', value: 40 },
    { lat: -23.5320, lng: -46.6680, name: 'Terminal Barra Funda', value: 44 }
  ];

  const savedPhotos: SavedPhoto[] = [
    { id: '8084', linha: '8084', velocidade: '40km/h', data: '10/10/2025', thumbnail: 'https://via.placeholder.com/100x80/4CAF50/FFFFFF?text=8084' },
    { id: '7500', linha: '7500', velocidade: '38km/h', data: '09/10/2025', thumbnail: 'https://via.placeholder.com/100x80/2196F3/FFFFFF?text=7500' },
    { id: '6300', linha: '6300', velocidade: '42km/h', data: '08/10/2025', thumbnail: 'https://via.placeholder.com/100x80/FF9800/FFFFFF?text=6300' },
    { id: '5100', linha: '5100', velocidade: '36km/h', data: '07/10/2025', thumbnail: 'https://via.placeholder.com/100x80/9C27B0/FFFFFF?text=5100' },
    { id: '4200', linha: '4200', velocidade: '44km/h', data: '06/10/2025', thumbnail: 'https://via.placeholder.com/100x80/F44336/FFFFFF?text=4200' },
    { id: '3900', linha: '3900', velocidade: '39km/h', data: '05/10/2025', thumbnail: 'https://via.placeholder.com/100x80/00BCD4/FFFFFF?text=3900' },
  ];

  const totalPages = Math.ceil(savedPhotos.length / itemsPerPage);
  const paginatedPhotos = savedPhotos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Por favor, digite o número da linha');
      return;
    }

    setLoading(true);
    setError(null);
    setPhotoData(null);

    try {
      // Buscar a linha pelo número
      const lines = await linesService.searchLines(searchQuery.trim());
      
      if (lines.length === 0) {
        setError(`Linha "${searchQuery}" não encontrada`);
        setSelectedLine(null);
        return;
      }

      // Pegar a primeira linha encontrada
      const line = lines[0];
      setSelectedLine(line);

      // Buscar dados de emissão da linha
      const emissionData = await emissionsService.getTotalLineEmission(line.name);
      
      if (emissionData.length === 0) {
        setError('Dados de emissão não disponíveis para esta linha');
        return;
      }

      // Usar os dados da linha correspondente (considerando direção)
      const lineEmission = emissionData.find(e => e.line.id === line.id) || emissionData[0];

      // Calcular IQAr estimado baseado na emissão por km
      // IQAr: 0-50 = Bom, 51-100 = Moderado, 101-200 = Ruim, 201+ = Péssimo
      // Fórmula: quanto maior a emissão por km, pior o IQAr
      const emissaoPorKm = lineEmission.emission / lineEmission.distance;
      
      console.log(`Linha ${line.name}:`, {
        emission: lineEmission.emission,
        distance: lineEmission.distance,
        emissaoPorKm: emissaoPorKm.toFixed(3)
      });
      
      // Normalizar para escala de IQAr (valores típicos de emissão/km estão entre 1.5 e 3.5)
      // Usar uma escala exponencial para criar maior variação
      let iqarEstimado: number;
      if (emissaoPorKm < 2.0) {
        // Emissão baixa -> IQAr bom (0-50)
        iqarEstimado = Math.round(emissaoPorKm * 25);
      } else if (emissaoPorKm < 2.5) {
        // Emissão média -> IQAr moderado (51-100)
        iqarEstimado = Math.round(50 + (emissaoPorKm - 2.0) * 100);
      } else if (emissaoPorKm < 3.5) {
        // Emissão alta -> IQAr ruim (101-200)
        iqarEstimado = Math.round(100 + (emissaoPorKm - 2.5) * 100);
      } else {
        // Emissão muito alta -> IQAr péssimo (201+)
        iqarEstimado = Math.round(200 + (emissaoPorKm - 3.5) * 50);
      }
      
      iqarEstimado = Math.max(0, Math.min(300, iqarEstimado)); // Limitar entre 0 e 300
      
      console.log(`IQAr calculado: ${iqarEstimado}`);

      const data: PhotoData = {
        id: line.id.toString(),
        linha: line.description || line.name,
        lineNumber: line.name,
        velocidadeMedia: 0, // Backend não fornece este dado ainda
        emissaoCarbono: lineEmission.emission,
        distancia: lineEmission.distance,
        iqar: iqarEstimado,
        data: new Date().toLocaleDateString('pt-BR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      };

      setPhotoData(data);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.response?.data?.detail || 'Erro ao buscar dados da linha');
      setSelectedLine(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareRoutes = async () => {
    if (!originAddress.trim() || !destinationAddress.trim()) {
      setError('Por favor, preencha origem e destino');
      return;
    }

    setLoading(true);
    setError(null);
    setRoutes([]);
    setSelectedRoute(null);

    try {
      const { routeComparisonService } = await import('../services/routeComparisonService');
      const result = await routeComparisonService.compareRoutes(
        originAddress.trim(),
        destinationAddress.trim()
      );
      
      setRoutes(result.routes);
      if (result.routes.length > 0) {
        setSelectedRoute(result.routes[0]);
      }
    } catch (err: any) {
      console.error('Erro ao comparar rotas:', err);
      setError(err.response?.data?.detail || 'Erro ao buscar rotas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchMode === 'line') {
        handleSearch();
      } else {
        handleCompareRoutes();
      }
    }
  };

  const handleSavePhoto = () => {
    if (!photoData) {
      alert('Nenhum dado para salvar. Por favor, busque uma linha primeiro.');
      return;
    }
    
    const message = `Dados da linha ${photoData.lineNumber} salvos:\n\n` +
      `• Emissão CO₂: ${photoData.emissaoCarbono.toFixed(2)} kg\n` +
      `• Distância: ${photoData.distancia.toFixed(2)} km\n` +
      `• Emissão/km: ${(photoData.emissaoCarbono / photoData.distancia).toFixed(3)} kg/km\n` +
      `• IQAr estimado: ${photoData.iqar}`;
    
    alert(message + '\n\n📸 Fotografia de frota salva com sucesso!');
  };

  const handleExportData = () => {
    if (!photoData) {
      alert('Nenhum dado para exportar. Por favor, busque uma linha primeiro.');
      return;
    }
    
    // Criar CSV com os dados
    const csvContent = `Linha,Descrição,Emissão CO2 (kg),Distância (km),Emissão por km (kg/km),IQAr Estimado,Data\n` +
      `${photoData.lineNumber},"${photoData.linha}",${photoData.emissaoCarbono.toFixed(2)},${photoData.distancia.toFixed(2)},${(photoData.emissaoCarbono / photoData.distancia).toFixed(3)},${photoData.iqar},${photoData.data}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `frota_${photoData.lineNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('📊 Dados exportados com sucesso!');
  };

  const getIQArQuality = (iqar: number) => {
    if (iqar <= 50) return { label: 'Bom', color: '#4CAF50', bg: '#E8F5E9' };
    if (iqar <= 100) return { label: 'Moderado', color: '#FF9800', bg: '#FFF3E0' };
    if (iqar <= 200) return { label: 'Ruim', color: '#F44336', bg: '#FFEBEE' };
    return { label: 'Péssimo', color: '#9C27B0', bg: '#F3E5F5' };
  };

  return (
    <div className="fleet-photos-container">
      <div className="photos-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Fotografias de Frota</h1>
            <p>Visualize e analise dados de qualidade do ar das frotas de transporte</p>
          </div>
          <button className="export-btn" onClick={handleExportData}>
            <FiDownload /> Exportar Dados
          </button>
        </div>
      </div>

      <div className="search-section">
        {/* Alternador de Modo */}
        <div className="mode-selector" style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1rem',
          justifyContent: 'center'
        }}>
          <button
            className={`mode-btn ${searchMode === 'line' ? 'active' : ''}`}
            onClick={() => setSearchMode('line')}
            style={{
              padding: '0.6rem 1.5rem',
              border: searchMode === 'line' ? '2px solid #2563eb' : '2px solid #e2e8f0',
              borderRadius: '8px',
              background: searchMode === 'line' ? '#dbeafe' : 'white',
              color: searchMode === 'line' ? '#1e40af' : '#64748b',
              fontWeight: searchMode === 'line' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🚌 Buscar por Linha
          </button>
          <button
            className={`mode-btn ${searchMode === 'route' ? 'active' : ''}`}
            onClick={() => setSearchMode('route')}
            style={{
              padding: '0.6rem 1.5rem',
              border: searchMode === 'route' ? '2px solid #2563eb' : '2px solid #e2e8f0',
              borderRadius: '8px',
              background: searchMode === 'route' ? '#dbeafe' : 'white',
              color: searchMode === 'route' ? '#1e40af' : '#64748b',
              fontWeight: searchMode === 'route' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📍 Comparar Rotas
          </button>
        </div>

        {/* Busca por Linha */}
        {searchMode === 'line' && (
          <>
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Digite o número da linha (ex: 8055-10)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="search-input"
              />
              {showSuggestions && filteredLines.length > 0 && (
                <div className="search-suggestions">
                  {filteredLines.map((line) => (
                    <div
                      key={line.id}
                      className="suggestion-item"
                      onClick={() => {
                        setSearchQuery(line.name);
                        setShowSuggestions(false);
                        setTimeout(() => handleSearch(), 100);
                      }}
                    >
                      <strong>{line.name}</strong>
                      {line.description && <span> - {line.description}</span>}
                      <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '8px' }}>
                        ({line.direction === 'MAIN' ? 'Ida' : 'Volta'})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="search-buttons">
              <button className="search-btn primary" onClick={handleSearch} disabled={loading}>
                <FiSearch /> {loading ? 'Buscando...' : 'Buscar Linha'}
              </button>
              <button 
                className="search-btn secondary" 
                onClick={handleSavePhoto}
                disabled={!photoData}
              >
                <FiSave /> Salvar Fotografia
              </button>
            </div>
          </>
        )}

        {/* Busca por Rota */}
        {searchMode === 'route' && (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
                <FiMapPin className="search-icon" />
                <input
                  type="text"
                  placeholder="Endereço de origem (ex: Av. Paulista, 1000, São Paulo)"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="search-input"
                />
              </div>
              <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
                <FiMapPin className="search-icon" />
                <input
                  type="text"
                  placeholder="Endereço de destino (ex: Rua da Consolação, 500, São Paulo)"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="search-input"
                />
              </div>
            </div>
            <div className="search-buttons">
              <button 
                className="search-btn primary" 
                onClick={handleCompareRoutes} 
                disabled={loading}
                style={{ width: '100%' }}
              >
                <FiSearch /> {loading ? 'Buscando rotas...' : 'Comparar Rotas'}
              </button>
            </div>
          </>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading />
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          borderRadius: 8,
          fontSize: '14px',
          margin: '1rem 0'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Resultados de Comparação de Rotas */}
      {searchMode === 'route' && routes.length > 0 && !loading && (
        <div className="route-comparison-results" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>
            📊 Rotas Encontradas ({routes.length})
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
            {routes.map((route, index) => (
              <div
                key={index}
                onClick={() => setSelectedRoute(route)}
                style={{
                  border: selectedRoute === route ? '3px solid #2563eb' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: selectedRoute === route ? '#f0f9ff' : 'white',
                  boxShadow: selectedRoute === route ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>
                    Rota {index + 1}
                  </h3>
                  {selectedRoute === route && (
                    <span style={{ 
                      backgroundColor: '#2563eb', 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      SELECIONADA
                    </span>
                  )}
                </div>

                <p style={{ 
                  color: '#64748b', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  {route.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>📏 Distância:</span>
                    <strong style={{ color: '#1e293b' }}>{route.distance_km.toFixed(2)} km</strong>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px'
                  }}>
                    <span style={{ color: '#92400e', fontSize: '0.9rem' }}>🌱 Emissão CO₂:</span>
                    <strong style={{ color: '#92400e' }}>{route.emission_kg_co2.toFixed(2)} kg</strong>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: route.emission_kg_co2 / route.distance_km < 0.3 ? '#dcfce7' : '#fee2e2',
                    borderRadius: '8px'
                  }}>
                    <span style={{ 
                      color: route.emission_kg_co2 / route.distance_km < 0.3 ? '#166534' : '#991b1b', 
                      fontSize: '0.9rem' 
                    }}>
                      📊 Emissão/km:
                    </span>
                    <strong style={{ 
                      color: route.emission_kg_co2 / route.distance_km < 0.3 ? '#166534' : '#991b1b'
                    }}>
                      {(route.emission_kg_co2 / route.distance_km).toFixed(3)} kg/km
                    </strong>
                  </div>
                </div>

                {route.segments.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>
                      📍 Trechos ({route.segments.length}):
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(expandedRoutes.has(index) ? route.segments : route.segments.slice(0, 3)).map((segment, segIndex) => (
                        <div 
                          key={segIndex}
                          style={{ 
                            fontSize: '0.85rem', 
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {segment.type === 'WALK' ? '🚶' : '🚌'}
                          <span style={{ 
                            color: segment.type === 'BUS' ? '#2563eb' : '#64748b',
                            fontWeight: segment.type === 'BUS' ? '600' : '400',
                            flex: 1
                          }}>
                            {segment.line_name || segment.instruction.substring(0, 40)}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            ({segment.distance_km.toFixed(2)} km)
                          </span>
                        </div>
                      ))}
                      {route.segments.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRoutes(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(index)) {
                                newSet.delete(index);
                              } else {
                                newSet.add(index);
                              }
                              return newSet;
                            });
                          }}
                          style={{
                            fontSize: '0.8rem',
                            color: '#2563eb',
                            background: 'none',
                            border: 'none',
                            padding: '0.25rem 0',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: '500',
                            textDecoration: 'underline'
                          }}
                        >
                          {expandedRoutes.has(index) 
                            ? '▲ Mostrar menos' 
                            : `▼ +${route.segments.length - 3} trechos`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedLine && photoData && !loading && searchMode === 'line' && (
        <div className="results-container">
          <div className="results-header">
            <h2>
              <FiMapPin className="header-icon" />
              Resultados para a linha "{selectedLine.name}" - {selectedLine.description}
            </h2>
            <div className="results-meta">
              <span className="meta-item">
                <FiCalendar /> {photoData.data}
              </span>
              <span className="meta-item">
                <FiTrendingUp /> Distância: {photoData.distancia.toFixed(2)}km
              </span>
            </div>
          </div>

          <div className="content-layout">
            {/* Coluna esquerda - Mapa e Timeline */}
            <div className="left-content">
              <div className="map-section">
                <div className="section-header">
                  <h3>Mapa da Rota</h3>
                  <div className="metric-selector">
                    <button 
                      className={`metric-btn ${selectedMetric === 'velocidade' ? 'active' : ''}`}
                      onClick={() => setSelectedMetric('velocidade')}
                    >
                      Velocidade
                    </button>
                    <button 
                      className={`metric-btn ${selectedMetric === 'emissao' ? 'active' : ''}`}
                      onClick={() => setSelectedMetric('emissao')}
                    >
                      Emissões
                    </button>
                    <button 
                      className={`metric-btn ${selectedMetric === 'iqar' ? 'active' : ''}`}
                      onClick={() => setSelectedMetric('iqar')}
                    >
                      IQAr
                    </button>
                  </div>
                </div>
                
                {/* Componente de mapa real com Leaflet */}
                <RouteMap
                  routePoints={routePoints}
                  selectedMetric={selectedMetric}
                  linha={photoData.lineNumber}
                  iqar={photoData.iqar}
                />
                
                <div className="map-legend">
                  <div className="legend-item">
                    <input 
                      type="checkbox" 
                      id="velocidade" 
                      checked={selectedMetric === 'velocidade'}
                      onChange={() => setSelectedMetric('velocidade')}
                    />
                    <label htmlFor="velocidade">
                      <span className="legend-color" style={{background: '#4CAF50'}}></span>
                      Velocidade média
                    </label>
                  </div>
                  <div className="legend-item">
                    <input 
                      type="checkbox" 
                      id="emissao"
                      checked={selectedMetric === 'emissao'}
                      onChange={() => setSelectedMetric('emissao')}
                    />
                    <label htmlFor="emissao">
                      <span className="legend-color" style={{background: '#FF5722'}}></span>
                      Emissão de carbono
                    </label>
                  </div>
                  <div className="legend-item">
                    <input 
                      type="checkbox" 
                      id="iqar"
                      checked={selectedMetric === 'iqar'}
                      onChange={() => setSelectedMetric('iqar')}
                    />
                    <label htmlFor="iqar">
                      <span className="legend-color" style={{background: '#2196F3'}}></span>
                      IQAr médio do itinerário
                    </label>
                  </div>
                </div>
              </div>

              <div className="timeline-section">
                <div className="section-header">
                  <h3>Timeline de Emissões</h3>
                  <button className="date-btn">
                    <FiCalendar /> {photoData.data}
                  </button>
                </div>

                <div className="emissions-chart">
                  <div className="chart-header">
                    <h4>Emissões de CO₂ (kg)</h4>
                    <div className="chart-legend-inline">
                      <span><span className="dot red"></span> Alta</span>
                      <span><span className="dot yellow"></span> Média</span>
                      <span><span className="dot green"></span> Baixa</span>
                    </div>
                  </div>
                  
                  <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EA4335" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#EA4335" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FBBC04" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#FBBC04" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#34A853" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#34A853" stopOpacity="0.05"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1"/>
                    
                    {/* Red line (Alta) */}
                    <path
                      d="M0,150 L100,130 L200,100 L300,80 L400,110 L500,120 L600,140"
                      fill="url(#redGradient)"
                      stroke="none"
                    />
                    <polyline
                      points="0,150 100,130 200,100 300,80 400,110 500,120 600,140"
                      fill="none"
                      stroke="#EA4335"
                      strokeWidth="3"
                    />
                    
                    {/* Yellow line (Média) */}
                    <path
                      d="M0,160 L100,145 L200,120 L300,110 L400,130 L500,140 L600,155 L600,200 L0,200"
                      fill="url(#yellowGradient)"
                      stroke="none"
                    />
                    <polyline
                      points="0,160 100,145 200,120 300,110 400,130 500,140 600,155"
                      fill="none"
                      stroke="#FBBC04"
                      strokeWidth="3"
                    />
                    
                    {/* Green line (Baixa) */}
                    <path
                      d="M0,170 L100,168 L200,160 L300,155 L400,162 L500,165 L600,172 L600,200 L0,200"
                      fill="url(#greenGradient)"
                      stroke="none"
                    />
                    <polyline
                      points="0,170 100,168 200,160 300,155 400,162 500,165 600,172"
                      fill="none"
                      stroke="#34A853"
                      strokeWidth="3"
                    />
                    
                    {/* Data points */}
                    <circle cx="300" cy="80" r="5" fill="#EA4335" stroke="white" strokeWidth="2"/>
                    <circle cx="400" cy="130" r="5" fill="#FBBC04" stroke="white" strokeWidth="2"/>
                    <circle cx="500" cy="165" r="5" fill="#34A853" stroke="white" strokeWidth="2"/>
                  </svg>
                  
                  <div className="chart-footer">
                    <span className="chart-axis-label">Segunda</span>
                    <span className="chart-axis-label">Terça</span>
                    <span className="chart-axis-label">Quarta</span>
                    <span className="chart-axis-label">Quinta</span>
                    <span className="chart-axis-label">Sexta</span>
                    <span className="chart-axis-label">Sábado</span>
                    <span className="chart-axis-label">Domingo</span>
                  </div>
                  
                  <div className="chart-controls">
                    <button className="chart-toggle">Última semana</button>
                    <button className="chart-toggle">Último mês</button>
                    <button className="chart-toggle active">Último ano</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita - Dados comparativos e fotos salvas */}
            <div className="right-content">
              <div className="comparative-card">
                <h3>Dados Comparativos</h3>
                <div className="time-filters">
                  <button className="time-filter">Dia</button>
                  <button className="time-filter active">Semana</button>
                  <button className="time-filter">Mês</button>
                  <button className="time-filter">Ano</button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{background: '#E3F2FD'}}>
                      <span style={{color: '#2196F3'}}>🚌</span>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Distância Total</span>
                      <span className="stat-value">{photoData.distancia.toFixed(2)} km</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon" style={{background: '#FFEBEE'}}>
                      <span style={{color: '#F44336'}}>☁️</span>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">CO₂ Emitido</span>
                      <span className="stat-value">{photoData.emissaoCarbono.toFixed(2)} kg</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon" style={{background: '#FFF3E0'}}>
                      <span style={{color: '#F57C00'}}>📊</span>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Emissão/km</span>
                      <span className="stat-value">{(photoData.emissaoCarbono / photoData.distancia).toFixed(3)} kg/km</span>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon" style={{background: getIQArQuality(photoData.iqar).bg}}>
                      <span style={{color: getIQArQuality(photoData.iqar).color}}>🍃</span>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">IQAr Estimado</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="stat-value">{photoData.iqar}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: getIQArQuality(photoData.iqar).color,
                          fontWeight: 600,
                          padding: '2px 8px',
                          background: getIQArQuality(photoData.iqar).bg,
                          borderRadius: '12px'
                        }}>
                          {getIQArQuality(photoData.iqar).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pie-chart-container">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="70" 
                      fill="none" 
                      stroke="#EA4335" 
                      strokeWidth="25" 
                      strokeDasharray="145 440" 
                      transform="rotate(-90 90 90)"
                    />
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="70" 
                      fill="none" 
                      stroke="#FBBC04" 
                      strokeWidth="25" 
                      strokeDasharray="145 440" 
                      strokeDashoffset="-145"
                      transform="rotate(-90 90 90)"
                    />
                    <circle 
                      cx="90" 
                      cy="90" 
                      r="70" 
                      fill="none" 
                      stroke="#34A853" 
                      strokeWidth="25" 
                      strokeDasharray="150 440" 
                      strokeDashoffset="-290"
                      transform="rotate(-90 90 90)"
                    />
                    <text x="90" y="85" textAnchor="middle" className="chart-center-text" fontSize="32" fontWeight="bold" fill="#2c3e50">
                      {photoData.iqar}
                    </text>
                    <text x="90" y="105" textAnchor="middle" className="chart-center-subtext" fontSize="12" fill="#6b7280">
                      IQAr Médio
                    </text>
                  </svg>
                </div>

                <div className="chart-legend-horizontal">
                  <div className="legend-h-item">
                    <span className="legend-dot" style={{background: '#EA4335'}}></span>
                    <span>Alta emissão</span>
                  </div>
                  <div className="legend-h-item">
                    <span className="legend-dot" style={{background: '#FBBC04'}}></span>
                    <span>Média emissão</span>
                  </div>
                  <div className="legend-h-item">
                    <span className="legend-dot" style={{background: '#34A853'}}></span>
                    <span>Baixa emissão</span>
                  </div>
                </div>
              </div>

              <div className="saved-photos-card">
                <div className="card-header">
                  <h3>Fotografias Salvas</h3>
                  <span className="photo-count">{savedPhotos.length} fotos</span>
                </div>
                
                <div className="photo-grid">
                  {paginatedPhotos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.thumbnail} alt={`Frota ${photo.linha}`} className="photo-thumbnail" />
                      <div className="photo-info">
                        <div className="photo-details">
                          <span className="photo-line">Linha {photo.linha}</span>
                          <span className="photo-date">{photo.data}</span>
                        </div>
                        <span className="photo-speed">{photo.velocidade}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </button>
                    <span className="page-info">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      className="pagination-btn"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FleetPhotosPage;