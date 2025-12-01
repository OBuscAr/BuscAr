# Guia de Implementação do Mapa de Rota

## Visão Geral

O mapa de rota foi implementado usando **React Leaflet**, uma biblioteca de mapeamento interativo gratuita e open-source baseada no Leaflet.js.

## Bibliotecas Instaladas

```bash
npm install leaflet react-leaflet @types/leaflet
```

## Componentes

### 1. RouteMap Component (`src/components/RouteMap.tsx`)

Componente principal que renderiza o mapa interativo com a rota do ônibus.

#### Props

```typescript
interface RouteMapProps {
  routePoints?: RoutePoint[];      // Pontos da rota
  selectedMetric: 'velocidade' | 'emissao' | 'iqar';  // Métrica selecionada
  linha: string;                    // Número da linha
  iqar?: number;                    // Valor do IQAr
}

interface RoutePoint {
  lat: number;        // Latitude
  lng: number;        // Longitude
  name?: string;      // Nome do ponto (ex: "Terminal Pinheiros")
  value?: number;     // Valor da métrica nesse ponto
}
```

#### Características

- **Mapa Interativo**: Zoom, pan, scroll
- **Marcadores Customizados**:
  - 🚌 Início da rota (verde)
  - 🏁 Fim da rota (vermelho)
  - Pontos intermediários com valores
- **Linha da Rota**: Polyline colorida conforme métrica
- **Popups Informativos**: Click nos marcadores para ver detalhes
- **Overlay de Informações**: Badges flutuantes com dados da linha
- **Auto-ajuste**: Mapa se ajusta automaticamente aos bounds da rota

## Como Usar

### Exemplo Básico

```tsx
import RouteMap from '../components/RouteMap';

const routePoints = [
  { lat: -23.5505, lng: -46.6333, name: 'Terminal A', value: 40 },
  { lat: -23.5470, lng: -46.6450, name: 'Parada B', value: 45 },
  { lat: -23.5320, lng: -46.6680, name: 'Terminal C', value: 42 }
];

<RouteMap
  routePoints={routePoints}
  selectedMetric="velocidade"
  linha="8084"
  iqar={85}
/>
```

### Integração com API

```tsx
const [routeData, setRouteData] = useState<RoutePoint[]>([]);

useEffect(() => {
  async function fetchRoute() {
    const response = await fetch(`/api/routes/${lineNumber}`);
    const data = await response.json();
    
    // Converter dados da API para formato RoutePoint
    const points = data.stops.map(stop => ({
      lat: stop.latitude,
      lng: stop.longitude,
      name: stop.name,
      value: stop.speedAverage // ou emissionValue, iqarValue
    }));
    
    setRouteData(points);
  }
  
  fetchRoute();
}, [lineNumber]);

<RouteMap
  routePoints={routeData}
  selectedMetric={selectedMetric}
  linha={lineNumber}
  iqar={iqarValue}
/>
```

## Customização

### Alterar Cores das Métricas

No arquivo `RouteMap.tsx`, modifique a função `getColor()`:

```tsx
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
```

### Alterar Estilo do Mapa

Você pode usar diferentes provedores de tiles:

```tsx
// OpenStreetMap padrão (atual)
<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

// Mapbox (requer API key)
<TileLayer
  url="https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}"
  attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
/>

// CartoDB Dark Matter
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
/>

// Stamen Terrain
<TileLayer
  url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg"
  attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>'
/>
```

### Customizar Marcadores

```tsx
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 35px;
      height: 35px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="color: white; font-size: 14px;">📍</span>
    </div>
  `,
  iconSize: [35, 35],
  iconAnchor: [17.5, 17.5]
});
```

### Adicionar Controles Extra

```tsx
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';

<MapContainer
  center={center}
  zoom={13}
  zoomControl={false} // Desabilita o padrão
>
  <ZoomControl position="bottomright" />
  {/* Outros componentes */}
</MapContainer>
```

## Estilos CSS

O arquivo `RouteMap.css` contém todos os estilos necessários:

- `.route-map-wrapper`: Container principal
- `.route-map-container`: Container do Leaflet
- `.map-info-overlay`: Badges de informação
- `.info-badge-map`: Estilo dos badges
- Customização dos controles Leaflet
- Animações dos marcadores

## Obtendo Coordenadas Reais

### Opção 1: Google Maps API

```typescript
async function getRouteCoordinates(origin: string, destination: string, waypoints: string[]) {
  const directionsService = new google.maps.DirectionsService();
  
  const result = await directionsService.route({
    origin,
    destination,
    waypoints: waypoints.map(w => ({ location: w })),
    travelMode: google.maps.TravelMode.DRIVING,
  });
  
  return result.routes[0].overview_path.map(point => ({
    lat: point.lat(),
    lng: point.lng()
  }));
}
```

### Opção 2: OpenRouteService (Gratuito)

```typescript
async function getRouteFromORS(start: [number, number], end: [number, number]) {
  const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
    method: 'POST',
    headers: {
      'Authorization': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates: [start, end]
    })
  });
  
  const data = await response.json();
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
    lat,
    lng
  }));
}
```

### Opção 3: Dados SPTrans (São Paulo)

Se estiver trabalhando com ônibus de São Paulo, pode usar a API SPTrans:

```typescript
async function getSPTransRoute(lineCode: string) {
  // Requer autenticação na API SPTrans
  const response = await fetch(
    `http://api.olhovivo.sptrans.com.br/v2.1/Linha/Buscar?termosBusca=${lineCode}`,
    {
      headers: {
        'Cookie': 'apiCredentials=YOUR_TOKEN'
      }
    }
  );
  
  const lineData = await response.json();
  // Processar dados para obter coordenadas
}
```

## Recursos Avançados

### Adicionar Heatmap

```bash
npm install leaflet.heat @types/leaflet.heat
```

```tsx
import 'leaflet.heat';

const HeatmapLayer = () => {
  const map = useMap();
  
  useEffect(() => {
    const heat = L.heatLayer(
      points.map(p => [p.lat, p.lng, p.value]),
      { radius: 25 }
    ).addTo(map);
    
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);
  
  return null;
};
```

### Adicionar Clustering

```bash
npm install react-leaflet-cluster
```

```tsx
import MarkerClusterGroup from 'react-leaflet-cluster';

<MarkerClusterGroup>
  {points.map((point, idx) => (
    <Marker key={idx} position={[point.lat, point.lng]} />
  ))}
</MarkerClusterGroup>
```

### Animação de Ônibus em Movimento

```tsx
const [busPosition, setBusPosition] = useState(routePoints[0]);
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentIndex(prev => {
      const next = (prev + 1) % routePoints.length;
      setBusPosition(routePoints[next]);
      return next;
    });
  }, 2000);
  
  return () => clearInterval(interval);
}, [routePoints]);

<Marker
  position={[busPosition.lat, busPosition.lng]}
  icon={busIcon}
>
  <Popup>Ônibus em movimento</Popup>
</Marker>
```

## Troubleshooting

### Ícones não aparecem

Certifique-se de importar o CSS do Leaflet:

```tsx
import 'leaflet/dist/leaflet.css';
```

E configurar os ícones padrão:

```tsx
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});
```

### Mapa não carrega

Verifique se o container tem altura definida:

```css
.route-map-container {
  height: 450px;
  width: 100%;
}
```

### Performance com muitos pontos

Use clustering ou simplifique a rota:

```typescript
function simplifyRoute(points: RoutePoint[], tolerance: number = 0.001) {
  // Implementar algoritmo Douglas-Peucker ou usar biblioteca
  return points.filter((_, idx) => idx % 2 === 0); // Exemplo simples
}
```

## Recursos Úteis

- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [OpenStreetMap Tiles](https://wiki.openstreetmap.org/wiki/Tile_servers)
- [Leaflet Plugins](https://leafletjs.com/plugins.html)
- [OpenRouteService API](https://openrouteservice.org/)
- [SPTrans API](http://www.sptrans.com.br/desenvolvedores/)

## Performance

- Tamanho do componente: ~8KB
- CSS: ~3KB
- Leaflet bundle: ~140KB (gzip: ~40KB)
- Performance otimizada com React.memo e useCallback quando necessário

## Licença

Leaflet é open-source sob BSD-2-Clause License.
OpenStreetMap data © OpenStreetMap contributors, ODbL.
