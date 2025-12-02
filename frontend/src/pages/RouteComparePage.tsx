import React, { useState } from 'react';
import '../style/FleetPhotosPage.css';
import { FiSearch } from 'react-icons/fi';
import RouteMap from '../components/RouteMap';
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

function RouteComparePage() {
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [originAirQuality, setOriginAirQuality] = useState<AirQualityData | null>(null);
  const [destinationAirQuality, setDestinationAirQuality] = useState<AirQualityData | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      handleCompareRoutes();
    }
  };

  return (
    <div className="fleet-photos-container">
      <div className="photos-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Comparação de Rotas</h1>
            <p>Compare rotas de ônibus e veja dados de emissões e qualidade do ar</p>
          </div>
        </div>
      </div>

      <div className="search-section">
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
      {routes.length > 0 && !loading && (
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
                      <div style={{ width: '40px', height: '8px', background: '#3b82f6', borderRadius: '3px' }}></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>🚌 Ônibus (linha azul)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '6px', background: '#64748b', borderRadius: '3px' }}></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>🚶 Caminhada (linha cinza)</span>
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
    </div>
  );
}

export default RouteComparePage;
