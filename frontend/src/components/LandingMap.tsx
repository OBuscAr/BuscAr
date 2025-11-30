import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Ponto central de São Paulo
const sampleLocations = [
  { lat: -23.5505, lng: -46.6333, name: 'São Paulo', description: 'Centro da cidade' },
];

// Componente para centralizar o mapa
function MapCenter() {
  const map = useMap();

  useEffect(() => {
    map.setView([-23.5505, -46.6333], 12);
  }, [map]);

  return null;
}

const LandingMap: React.FC = () => {
  return (
    <div className="landing-map-container">
      <MapContainer
        center={[-23.5505, -46.6333]}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapCenter />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marcadores de exemplo */}
        {sampleLocations.map((location, index) => (
          <Marker key={index} position={[location.lat, location.lng]}>
            <Popup>
              <div>
                <strong>{location.name}</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                  {location.description}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LandingMap;
