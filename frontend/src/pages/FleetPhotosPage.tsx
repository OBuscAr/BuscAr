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

interface AirQualityIndex {
  code: string;
  displayName: string;
  aqi: number;
  category: string;
}

interface AirQualityData {
  indexes: AirQualityIndex[];
  health_recommendation: string;
}

interface RouteComparisonResponse {
  origin_air_quality: AirQualityData;
  destination_air_quality: AirQualityData;
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



function FleetPhotosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [originAirQuality, setOriginAirQuality] = useState<AirQualityData | null>(null);
  const [destinationAirQuality, setDestinationAirQuality] = useState<AirQualityData | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{lat: number, lng: number, name?: string, value?: number}>>([]);
  const [allLines, setAllLines] = useState<Line[]>([]);
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'line' | 'route'>('line');
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<'velocidade' | 'emissao' | 'iqar'>('velocidade');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Buscar paradas da linha para exibir no mapa
      const stops = await linesService.getLineStops(line.id);
      console.log(`Paradas encontradas para linha ${line.name}:`, stops.length);
      
      const points = stops.map((stop) => ({
        lat: stop.latitude,
        lng: stop.longitude,
        name: stop.name,
        value: undefined // Será populado quando tivermos dados por parada
      }));
      setRoutePoints(points);
      
      if (stops.length === 0) {
        console.warn('Nenhuma parada encontrada para esta linha');
      }

      // Buscar polyline real do Google entre primeira e última parada
      if (stops.length >= 2) {
        try {
          const firstStop = stops[0];
          const lastStop = stops[stops.length - 1];
          
          // Criar endereços a partir das coordenadas
          const originAddress = `${firstStop.latitude},${firstStop.longitude}`;
          const destinationAddress = `${lastStop.latitude},${lastStop.longitude}`;
          
          console.log('Buscando rota real do Google...');
          const { routeComparisonService } = await import('../services/routeComparisonService');
          const routeData = await routeComparisonService.compareRoutes(originAddress, destinationAddress);
          
          // Usar a primeira rota retornada (geralmente a melhor)
          if (routeData.routes.length > 0) {
            const bestRoute = routeData.routes[0];
            // Armazenar a rota selecionada para usar no mapa
            setSelectedRoute(bestRoute);
            console.log('Polyline do Google carregada com sucesso');
          }
        } catch (err) {
          console.warn('Erro ao buscar polyline do Google, usando rota linear:', err);
          // Se falhar, continua com a rota linear (points já foram setados)
        }
      }

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
      
      setOriginAirQuality(result.origin_air_quality);
      setDestinationAirQuality(result.destination_air_quality);
      setRoutes(result.routes);
      if (result.routes.length > 0) {
        setSelectedRoute(result.routes[0]);
      } else {
        setError('Nenhuma rota encontrada entre estes endereços. Por favor, verifique se os endereços estão corretos e tente especificar melhor (ex: incluir número, bairro e cidade).');
      }
    } catch (err: any) {
      console.error('Erro ao comparar rotas:', err);
      setError(err.response?.data?.detail || 'Erro ao buscar rotas. Verifique se os endereços estão corretos e tente novamente.');
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
    
    alert(message + '\n\nFotografia de frota salva com sucesso!');
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
            <h1>Fotografias de Frota e Comparação de Rotas</h1>
            <p>Visualize e analise dados de qualidade do ar das frotas de transporte e compare rotas</p>
          </div>
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
            Buscar por Linha
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
            Comparar Rotas
          </button>
        </div>

        {/* Busca por Linha */}
        {searchMode === 'line' && (
          <>
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
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
                onClick={handleExportData}
                disabled={!photoData}
              >
                <FiDownload /> Exportar Dados
              </button>
            </div>
          </>
        )}

        {/* Busca por Rota */}
        {searchMode === 'route' && (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
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
            Rotas Encontradas ({routes.length})
          </h2>

          {/* Seção de Qualidade do Ar */}
          {(originAirQuality || destinationAirQuality) && (
            <div style={{ 
              marginBottom: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {originAirQuality && (
                <div style={{
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '2px solid #7dd3fc'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#0c4a6e', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Qualidade do Ar - Origem
                  </h3>
                  {originAirQuality.indexes.map((index, idx) => (
                    <div key={idx} style={{ 
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        {index.displayName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0c4a6e' }}>
                          {index.aqi}
                        </span>
                        <span style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600',
                          color: '#0369a1',
                          background: 'rgba(255, 255, 255, 0.9)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px'
                        }}>
                          {index.category}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#334155',
                    lineHeight: '1.5'
                  }}>
                    💡 {originAirQuality.health_recommendation}
                  </div>
                </div>
              )}

              {destinationAirQuality && (
                <div style={{
                  background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '2px solid #a78bfa'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#5b21b6', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Qualidade do Ar - Destino
                  </h3>
                  {destinationAirQuality.indexes.map((index, idx) => (
                    <div key={idx} style={{ 
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        {index.displayName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#5b21b6' }}>
                          {index.aqi}
                        </span>
                        <span style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600',
                          color: '#6d28d9',
                          background: 'rgba(255, 255, 255, 0.9)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px'
                        }}>
                          {index.category}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#334155',
                    lineHeight: '1.5'
                  }}>
                    💡 {destinationAirQuality.health_recommendation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mapa da rota selecionada */}
          {selectedRoute && (
            <div className="map-section" style={{ marginBottom: '2rem' }}>
              <div className="section-header">
                <h3>Visualização da Rota Selecionada</h3>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  {selectedRoute.description}
                </span>
              </div>
              <RouteMap
                mode="route"
                encodedPolyline={selectedRoute.polyline.encodedPolyline}
                segments={selectedRoute.segments}
                selectedMetric="emissao"
                linha={selectedRoute.description}
                iqar={Math.round(((originAirQuality?.indexes.find(i => i.code === 'bra_saopaulo')?.aqi || 0) + (destinationAirQuality?.indexes.find(i => i.code === 'bra_saopaulo')?.aqi || 0)) / 2)}
              />
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '8px',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Legenda:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '6px', background: '#3b82f6', borderRadius: '3px' }}></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>🚌 Ônibus</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '6px', 
                        background: 'repeating-linear-gradient(90deg, #475569 0, #475569 10px, transparent 10px, transparent 15px)',
                        borderRadius: '3px'
                      }}></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>🚶 Caminhada</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                      💡 Passe o mouse sobre a rota para ver detalhes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Cards de rotas */}
          
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
                      Trechos ({route.segments.length}):
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
                </div>
                
                {/* Nota informativa sobre paradas */}
                {routePoints.length > 0 && (
                  <div style={{ 
                    padding: '0.75rem', 
                    background: selectedRoute ? '#f0fdf4' : '#f0f9ff', 
                    border: selectedRoute ? '1px solid #bbf7d0' : '1px solid #bae6fd',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: selectedRoute ? '#166534' : '#0369a1'
                  }}>
                    {selectedRoute ? '🗺️ ' : '📍 '}
                    <strong>{routePoints.length} paradas</strong> encontradas. 
                    {selectedRoute && ' Exibindo rota real seguindo as ruas.'}
                    {!selectedRoute && ' Rota conecta paradas em linha reta.'}
                    {' '}Passe o mouse sobre os marcadores para ver detalhes.
                  </div>
                )}
                
                {/* Componente de mapa real com Leaflet */}
                <RouteMap
                  mode="line"
                  routePoints={routePoints}
                  selectedMetric={selectedMetric}
                  linha={photoData.lineNumber}
                  iqar={photoData.iqar}
                  useGooglePolyline={!!selectedRoute}
                  encodedPolyline={selectedRoute?.polyline?.encodedPolyline}
                />
              </div>
            </div>

            {/* Coluna direita - Dados comparativos */}
            <div className="right-content">
                <div className="comparative-card">
                  <h3>Dados</h3>

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
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    {/* Fundo cinza claro */}
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#e5e7eb" 
                      strokeWidth="30"
                    />
                    
                    {/* Barra de progresso dinâmica baseada no IQAr */}
                    {(() => {
                      const circumference = 2 * Math.PI * 80;
                      const maxIqar = 300;
                      const percentage = Math.min((photoData.iqar / maxIqar) * 100, 100);
                      const dashOffset = circumference - (percentage / 100) * circumference;
                      
                      // Determinar cor baseada no IQAr
                      let color = '#34A853'; // Verde (Bom)
                      if (photoData.iqar > 200) {
                        color = '#9C27B0'; // Roxo (Péssimo)
                      } else if (photoData.iqar > 100) {
                        color = '#F44336'; // Vermelho (Ruim)
                      } else if (photoData.iqar > 50) {
                        color = '#FF9800'; // Laranja (Moderado)
                      }
                      
                      return (
                        <circle 
                          cx="100" 
                          cy="100" 
                          r="80" 
                          fill="none" 
                          stroke={color}
                          strokeWidth="30"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                      );
                    })()}
                    
                    {/* Texto central */}
                    <text x="100" y="95" textAnchor="middle" fontSize="42" fontWeight="bold" fill={getIQArQuality(photoData.iqar).color}>
                      {photoData.iqar}
                    </text>
                    <text x="100" y="115" textAnchor="middle" fontSize="14" fill="#6b7280" fontWeight="600">
                      IQAr
                    </text>
                    <text x="100" y="132" textAnchor="middle" fontSize="12" fill={getIQArQuality(photoData.iqar).color} fontWeight="700">
                      {getIQArQuality(photoData.iqar).label}
                    </text>
                  </svg>
                </div>

                <div className="chart-legend-horizontal">
                  <div style={{ 
                    padding: '0.75rem', 
                    background: '#f8fafc', 
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Escala de Qualidade do Ar:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="legend-dot" style={{background: '#34A853', width: '12px', height: '12px'}}></span>
                        <span style={{ fontSize: '0.8rem' }}>0-50: Bom</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="legend-dot" style={{background: '#FF9800', width: '12px', height: '12px'}}></span>
                        <span style={{ fontSize: '0.8rem' }}>51-100: Moderado</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="legend-dot" style={{background: '#F44336', width: '12px', height: '12px'}}></span>
                        <span style={{ fontSize: '0.8rem' }}>101-200: Ruim</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="legend-dot" style={{background: '#9C27B0', width: '12px', height: '12px'}}></span>
                        <span style={{ fontSize: '0.8rem' }}>201+: Péssimo</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b', 
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    *Baseado na emissão de CO₂ por km da linha
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FleetPhotosPage;