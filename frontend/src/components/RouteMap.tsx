import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../style/RouteMap.css';

// Fix para ícones padrão do Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
  value?: number;
}

interface RouteSegment {
  type: 'WALK' | 'BUS';
  instruction: string;
  distance_km: number;
  line_name: string | null;
  line_color: string | null;
  polyline: {
    encodedPolyline: string;
  };
}

interface RouteMapProps {
  routePoints?: RoutePoint[];
  selectedMetric: 'velocidade' | 'emissao' | 'iqar';
  linha: string;
  iqar?: number;
  encodedPolyline?: string;
  segments?: RouteSegment[];
  mode?: 'line' | 'route';
  useGooglePolyline?: boolean; // Nova prop para usar polyline do Google no modo line
}

// Função para decodificar polyline do Google
function decodePolyline(encoded: string): Array<[number, number]> {
  const poly: Array<[number, number]> = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
}

// Componente para ajustar o mapa aos bounds
function MapBounds({ routePoints }: { routePoints: RoutePoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (routePoints.length > 0) {
      const bounds = L.latLngBounds(routePoints.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routePoints, map]);

  return null;
}

const RouteMap: React.FC<RouteMapProps> = ({ 
  routePoints,
  encodedPolyline,
  segments,
  mode = 'line',
  useGooglePolyline = false, 
  selectedMetric, 
  linha,
  iqar = 85 
}) => {
  // Rota padrão de exemplo - São Paulo (região central)
  const defaultRoute: RoutePoint[] = [
    { lat: -23.5505, lng: -46.6333, name: 'Terminal Pinheiros', value: 40 },
    { lat: -23.5489, lng: -46.6388, name: 'Av. Rebouças', value: 45 },
    { lat: -23.5470, lng: -46.6450, name: 'Av. Paulista', value: 35 },
    { lat: -23.5440, lng: -46.6520, name: 'Consolação', value: 38 },
    { lat: -23.5400, lng: -46.6580, name: 'Centro', value: 42 },
    { lat: -23.5350, lng: -46.6620, name: 'República', value: 40 },
    { lat: -23.5320, lng: -46.6680, name: 'Terminal Barra Funda', value: 44 }
  ];

  const points = routePoints && routePoints.length > 0 ? routePoints : defaultRoute;

  // Configuração de cores por métrica
  const getColor = () => {
    switch (selectedMetric) {
      case 'velocidade':
        return '#4CAF50'; // Verde
      case 'emissao':
        return '#FF5722'; // Vermelho
      case 'iqar':
        return '#2196F3'; // Azul
      default:
        return '#4CAF50';
    }
  };

  // Ícone customizado para pontos de parada
  const createCustomIcon = (value?: number, metricColor?: string) => {
    const color = metricColor || getColor();
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        ">
          ${value || ''}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  // Ícone para início da rota
  const startIcon = L.divIcon({
    className: 'start-marker',
    html: `
      <div style="
        background-color: #22c55e;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 2px 12px rgba(34, 197, 94, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
      ">
        🚌
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });

  // Ícone para fim da rota
  const endIcon = L.divIcon({
    className: 'end-marker',
    html: `
      <div style="
        background-color: #ef4444;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 2px 12px rgba(239, 68, 68, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
      ">
        🏁
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });

  // Processar polyline se estiver no modo route OU se usar Google polyline no modo line
  let decodedPolylines: Array<[number, number]> = [];
  if ((mode === 'route' || useGooglePolyline) && encodedPolyline) {
    decodedPolylines = decodePolyline(encodedPolyline);
  }

  const lineCoordinates: [number, number][] = (mode === 'line' && !useGooglePolyline)
    ? points.map(p => [p.lat, p.lng])
    : decodedPolylines;

  const center: [number, number] = lineCoordinates.length > 0 
    ? lineCoordinates[0]
    : (points.length > 0 ? [points[0].lat, points[0].lng] : [-23.5505, -46.6333]);

  return (
    <div className="route-map-wrapper">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="route-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Renderizar segmentos no modo route */}
        {mode === 'route' && segments && segments.map((segment, index) => {
          const segmentPolyline = decodePolyline(segment.polyline.encodedPolyline);
          // Cores mais vibrantes e visíveis
          const color = segment.type === 'WALK' 
            ? '#475569' // Cinza escuro para caminhada
            : segment.line_color || '#3b82f6'; // Cor da linha ou azul mais forte
          
          const isBus = segment.type === 'BUS';
          
          return (
            <Polyline
              key={index}
              positions={segmentPolyline}
              color={color}
              weight={isBus ? 8 : 6}
              opacity={0.9}
              eventHandlers={{
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    weight: segment.type === 'BUS' ? 10 : 8,
                    opacity: 1
                  });
                  layer.openPopup();
                },
                mouseout: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    weight: segment.type === 'BUS' ? 8 : 6,
                    opacity: 0.9
                  });
                  layer.closePopup();
                }
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{segment.type === 'WALK' ? '🚶 Caminhada' : '🚌 Ônibus'}</strong>
                  {segment.line_name && <p><strong>Linha:</strong> {segment.line_name}</p>}
                  <p><strong>Distância:</strong> {segment.distance_km.toFixed(2)} km</p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{segment.instruction}</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Linha da rota no modo line (pode ser linear ou Google polyline) */}
        {mode === 'line' && lineCoordinates.length > 0 && (
          <Polyline
            positions={lineCoordinates}
            color={getColor()}
            weight={8}
            opacity={0.9}
            eventHandlers={{
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 10,
                  opacity: 1
                });
                layer.openPopup();
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 8,
                  opacity: 0.9
                });
                layer.closePopup();
              }
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>🚌 Linha {linha}</strong>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {useGooglePolyline ? '🗺️ Rota real (Google Maps)' : '📍 Rota conectando paradas'}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {selectedMetric === 'velocidade' && 'Métrica: Velocidade'}
                  {selectedMetric === 'emissao' && 'Métrica: Emissões'}
                  {selectedMetric === 'iqar' && 'Métrica: IQAr'}
                </p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Marcadores no modo line (sempre mostrar se houver pontos) */}
        {mode === 'line' && points && points.length > 0 && (
          <>
            {/* Marcador de início */}
            {points[0] && (
              <Marker 
                position={[points[0].lat, points[0].lng]} 
                icon={startIcon}
                eventHandlers={{
                  mouseover: (e) => e.target.openPopup(),
                  mouseout: (e) => e.target.closePopup()
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>🚌 Início da Rota</strong>
                    <p>{points[0].name || 'Ponto Inicial'}</p>
                    <p>Linha {linha}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marcadores intermediários - mostrar TODAS as paradas */}
            {points.slice(1, -1).map((point, index) => (
              <Marker
                key={`stop-${index}-${selectedMetric}`}
                position={[point.lat, point.lng]}
                icon={createCustomIcon(point.value, getColor())}
                eventHandlers={{
                  mouseover: (e) => e.target.openPopup(),
                  mouseout: (e) => e.target.closePopup()
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{point.name || `Parada ${index + 1}`}</strong>
                    <p style={{ fontSize: '0.9rem', margin: '4px 0' }}>
                      {point.name && point.name.length > 30 ? point.name.substring(0, 30) + '...' : point.name}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Marcador de fim */}
            {points.length > 1 && points[points.length - 1] && (
              <Marker 
                position={[points[points.length - 1].lat, points[points.length - 1].lng]} 
                icon={endIcon}
                eventHandlers={{
                  mouseover: (e) => e.target.openPopup(),
                  mouseout: (e) => e.target.closePopup()
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>🏁 Fim da Rota</strong>
                    <p>{points[points.length - 1].name || 'Ponto Final'}</p>
                    <p>Linha {linha}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}

        {/* Marcadores de origem e destino no modo route */}
        {mode === 'route' && lineCoordinates.length > 0 && (
          <>
            <Marker position={lineCoordinates[0]} icon={startIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>📍 Origem</strong>
                </div>
              </Popup>
            </Marker>
            <Marker position={lineCoordinates[lineCoordinates.length - 1]} icon={endIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>🎯 Destino</strong>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        <MapBounds routePoints={mode === 'line' ? points : lineCoordinates.map(c => ({ lat: c[0], lng: c[1] }))} />
      </MapContainer>

      {/* Info overlay */}
      <div className="map-info-overlay">
        <div className="info-badge-map">
          <span className="badge-label">Linha</span>
          <span className="badge-value">{linha}</span>
        </div>
        {mode === 'route' && iqar > 0 && (
          <div className="info-badge-map">
            <span className="badge-label">IQAr</span>
            <span className={`badge-value ${iqar > 80 ? 'good' : iqar > 50 ? 'moderate' : 'poor'}`}>
              {iqar}
            </span>
          </div>
        )}
        <div className="info-badge-map metric-badge">
          <span className="badge-label">Métrica</span>
          <span className="badge-value" style={{ color: getColor() }}>
            {selectedMetric === 'velocidade' ? 'Velocidade' : 
             selectedMetric === 'emissao' ? 'Emissões' : 'IQAr'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
