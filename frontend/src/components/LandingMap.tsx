import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../style/LandingMap.css';

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

interface LandingMapProps {
  encodedPolyline?: string;
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

// Componente para centralizar o mapa (quando não há rota)
function MapCenter() {
  const map = useMap();

  useEffect(() => {
    map.setView([-23.5505, -46.6333], 12);
  }, [map]);

  return null;
}

// Componente para ajustar o mapa aos bounds da rota
function MapBounds({ routePoints }: { routePoints: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (routePoints.length > 0) {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routePoints, map]);

  return null;
}

const LandingMap: React.FC<LandingMapProps> = ({ encodedPolyline }) => {
  const routePoints = encodedPolyline ? decodePolyline(encodedPolyline) : [];
  const hasRoute = routePoints.length > 0;
  return (
    <div className="landing-map-container">
      <MapContainer
        center={[-23.5505, -46.6333]}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {hasRoute ? <MapBounds routePoints={routePoints} /> : <MapCenter />}
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Desenha a rota se houver polyline */}
        {hasRoute && (
          <>
            <Polyline
              positions={routePoints}
              color="#10b981"
              weight={4}
              opacity={0.8}
            />
            
            {/* Marcadores de início e fim */}
            {routePoints.length > 0 && (
              <>
                <Marker position={routePoints[0]}>
                  <Popup>
                    <div>
                      <strong>Origem</strong>
                    </div>
                  </Popup>
                </Marker>
                <Marker position={routePoints[routePoints.length - 1]}>
                  <Popup>
                    <div>
                      <strong>Destino</strong>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </>
        )}
        
        {/* Marcador central apenas quando não há rota */}
        {!hasRoute && (
          <Marker position={[-23.5505, -46.6333]}>
            <Popup>
              <div>
                <strong>São Paulo</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                  Centro da cidade
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LandingMap;
