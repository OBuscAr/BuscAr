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

interface RouteMapProps {
  routePoints?: RoutePoint[];
  selectedMetric: 'velocidade' | 'emissao' | 'iqar';
  linha: string;
  iqar?: number;
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
  const createCustomIcon = (value?: number) => {
    const color = getColor();
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

  const lineCoordinates: [number, number][] = points.map(p => [p.lat, p.lng]);
  const center: [number, number] = points.length > 0 
    ? [points[0].lat, points[0].lng] 
    : [-23.5505, -46.6333];

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
        
        {/* Linha da rota */}
        <Polyline
          positions={lineCoordinates}
          color={getColor()}
          weight={5}
          opacity={0.8}
        />

        {/* Marcador de início */}
        <Marker position={[points[0].lat, points[0].lng]} icon={startIcon}>
          <Popup>
            <div className="map-popup">
              <strong>🚌 Início da Rota</strong>
              <p>{points[0].name || 'Ponto Inicial'}</p>
              <p>Linha {linha}</p>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores intermediários */}
        {points.slice(1, -1).map((point, index) => (
          <Marker
            key={index}
            position={[point.lat, point.lng]}
            icon={createCustomIcon(point.value)}
          >
            <Popup>
              <div className="map-popup">
                <strong>{point.name || `Parada ${index + 1}`}</strong>
                <p>
                  {selectedMetric === 'velocidade' && `Velocidade: ${point.value || 40} km/h`}
                  {selectedMetric === 'emissao' && `Emissão: ${point.value || 100} kg CO₂`}
                  {selectedMetric === 'iqar' && `IQAr: ${point.value || 85}`}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marcador de fim */}
        {points.length > 1 && (
          <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]} icon={endIcon}>
            <Popup>
              <div className="map-popup">
                <strong>🏁 Fim da Rota</strong>
                <p>{points[points.length - 1].name || 'Ponto Final'}</p>
                <p>Linha {linha}</p>
              </div>
            </Popup>
          </Marker>
        )}

        <MapBounds routePoints={points} />
      </MapContainer>

      {/* Info overlay */}
      <div className="map-info-overlay">
        <div className="info-badge-map">
          <span className="badge-label">Linha</span>
          <span className="badge-value">{linha}</span>
        </div>
        <div className="info-badge-map">
          <span className="badge-label">IQAr</span>
          <span className={`badge-value ${iqar > 80 ? 'good' : iqar > 50 ? 'moderate' : 'poor'}`}>
            {iqar}
          </span>
        </div>
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
