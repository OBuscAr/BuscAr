# Exemplo Prático: Integrando Dados Reais de Rotas

## Cenário 1: Dados de Coordenadas Fixas (Mais Simples)

Se você já tem as coordenadas das paradas da linha de ônibus:

```typescript
// services/routeService.ts
interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  avgSpeed?: number;
  emissions?: number;
  iqar?: number;
}

const busStops8084: BusStop[] = [
  {
    id: "1",
    name: "Terminal Pinheiros",
    latitude: -23.5505,
    longitude: -46.6333,
    avgSpeed: 40,
    emissions: 120,
    iqar: 85
  },
  {
    id: "2",
    name: "Av. Rebouças, 3000",
    latitude: -23.5489,
    longitude: -46.6388,
    avgSpeed: 45,
    emissions: 110,
    iqar: 80
  },
  // ... mais paradas
];

export function getRouteStops(lineNumber: string): BusStop[] {
  // Aqui você buscaria do banco de dados ou API
  // Por enquanto retornamos dados mockados
  return busStops8084;
}
```

**Uso no componente:**

```tsx
import { getRouteStops } from '../services/routeService';

function FleetPhotosPage() {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  
  useEffect(() => {
    if (selectedLine) {
      const stops = getRouteStops(selectedLine);
      const points = stops.map(stop => ({
        lat: stop.latitude,
        lng: stop.longitude,
        name: stop.name,
        value: selectedMetric === 'velocidade' ? stop.avgSpeed :
               selectedMetric === 'emissao' ? stop.emissions :
               stop.iqar
      }));
      setRoutePoints(points);
    }
  }, [selectedLine, selectedMetric]);
  
  return (
    <RouteMap
      routePoints={routePoints}
      selectedMetric={selectedMetric}
      linha={selectedLine}
      iqar={calculateAvgIqar(routePoints)}
    />
  );
}
```

## Cenário 2: Integração com Backend (API REST)

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
});

export interface RouteData {
  lineNumber: string;
  stops: Array<{
    id: string;
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    metrics: {
      avgSpeed: number;
      emissions: number;
      iqar: number;
    };
  }>;
  metadata: {
    totalDistance: number;
    avgIqar: number;
    avgSpeed: number;
  };
}

export async function fetchRouteData(lineNumber: string): Promise<RouteData> {
  try {
    const response = await api.get(`/routes/${lineNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching route data:', error);
    throw error;
  }
}
```

**Backend exemplo (FastAPI):**

```python
# backend/routes.py
from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()

@router.get("/routes/{line_number}")
async def get_route(line_number: str):
    # Buscar do banco de dados
    route = await db.routes.find_one({"lineNumber": line_number})
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    return {
        "lineNumber": route["lineNumber"],
        "stops": [
            {
                "id": stop["id"],
                "name": stop["name"],
                "coordinates": {
                    "lat": stop["latitude"],
                    "lng": stop["longitude"]
                },
                "metrics": {
                    "avgSpeed": stop["avgSpeed"],
                    "emissions": stop["emissions"],
                    "iqar": stop["iqar"]
                }
            }
            for stop in route["stops"]
        ],
        "metadata": {
            "totalDistance": route["totalDistance"],
            "avgIqar": route["avgIqar"],
            "avgSpeed": route["avgSpeed"]
        }
    }
```

**Uso no frontend:**

```tsx
import { fetchRouteData } from '../services/api';

function FleetPhotosPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchRouteData(searchQuery);
      setRouteData(data);
      setSelectedLine(searchQuery);
    } catch (err) {
      setError('Não foi possível carregar os dados da rota');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const routePoints = routeData?.stops.map(stop => ({
    lat: stop.coordinates.lat,
    lng: stop.coordinates.lng,
    name: stop.name,
    value: selectedMetric === 'velocidade' ? stop.metrics.avgSpeed :
           selectedMetric === 'emissao' ? stop.metrics.emissions :
           stop.metrics.iqar
  })) || [];

  return (
    <>
      {/* ... search section ... */}
      
      {loading && <div className="loading">Carregando rota...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {routeData && (
        <RouteMap
          routePoints={routePoints}
          selectedMetric={selectedMetric}
          linha={routeData.lineNumber}
          iqar={routeData.metadata.avgIqar}
        />
      )}
    </>
  );
}
```

## Cenário 3: Geocoding (Converter endereços em coordenadas)

Se você tem apenas endereços das paradas:

```typescript
// services/geocoding.ts
import axios from 'axios';

interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  // Usando Nominatim (OpenStreetMap) - gratuito, sem API key
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: address,
      format: 'json',
      limit: 1
    },
    headers: {
      'User-Agent': 'BuscAr-App/1.0' // Obrigatório para Nominatim
    }
  });

  if (response.data.length === 0) {
    throw new Error(`Não foi possível geocodificar: ${address}`);
  }

  const result = response.data[0];
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    address: result.display_name
  };
}

export async function geocodeBusStops(stops: Array<{name: string, address: string}>) {
  const geocoded = await Promise.all(
    stops.map(async (stop) => {
      try {
        const coords = await geocodeAddress(stop.address);
        return {
          name: stop.name,
          lat: coords.lat,
          lng: coords.lng
        };
      } catch (error) {
        console.error(`Failed to geocode ${stop.name}:`, error);
        return null;
      }
    })
  );

  return geocoded.filter(stop => stop !== null);
}
```

**Exemplo de uso:**

```typescript
const busStops = [
  { name: "Terminal Pinheiros", address: "Av. Pedroso de Morais, 2130, São Paulo, SP" },
  { name: "Av. Rebouças", address: "Av. Rebouças, 3000, São Paulo, SP" },
  // ...
];

const routePoints = await geocodeBusStops(busStops);
```

## Cenário 4: Usando SPTrans API (São Paulo)

```typescript
// services/sptrans.ts
class SPTransAPI {
  private baseUrl = 'http://api.olhovivo.sptrans.com.br/v2.1';
  private token: string = '';

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/Login/Autenticar?token=YOUR_TOKEN`, {
      method: 'POST'
    });
    
    if (response.ok) {
      // Token armazenado em cookie
      this.token = await response.text();
    }
  }

  async searchLine(searchTerm: string) {
    await this.authenticate();
    
    const response = await fetch(
      `${this.baseUrl}/Linha/Buscar?termosBusca=${searchTerm}`,
      {
        credentials: 'include' // Envia cookies
      }
    );
    
    return await response.json();
  }

  async getLineDetails(lineCode: number) {
    await this.authenticate();
    
    const response = await fetch(
      `${this.baseUrl}/Linha/CarregarDetalhes?codigoLinha=${lineCode}`,
      {
        credentials: 'include'
      }
    );
    
    return await response.json();
  }

  async getVehiclePositions(lineCode: number) {
    await this.authenticate();
    
    const response = await fetch(
      `${this.baseUrl}/Posicao/Linha?codigoLinha=${lineCode}`,
      {
        credentials: 'include'
      }
    );
    
    return await response.json();
  }
}

export const sptransAPI = new SPTransAPI();
```

## Cenário 5: Armazenamento Local (Mock com LocalStorage)

Para desenvolvimento e testes:

```typescript
// utils/mockData.ts
const MOCK_ROUTES_KEY = 'buscar_mock_routes';

export interface MockRoute {
  lineNumber: string;
  stops: Array<{
    name: string;
    lat: number;
    lng: number;
    avgSpeed: number;
    emissions: number;
    iqar: number;
  }>;
}

const defaultRoutes: MockRoute[] = [
  {
    lineNumber: "8084",
    stops: [
      { name: "Terminal Pinheiros", lat: -23.5505, lng: -46.6333, avgSpeed: 40, emissions: 120, iqar: 85 },
      { name: "Av. Rebouças", lat: -23.5489, lng: -46.6388, avgSpeed: 45, emissions: 110, iqar: 80 },
      // ...
    ]
  },
  {
    lineNumber: "7500",
    stops: [
      // ...
    ]
  }
];

export function initMockData() {
  if (!localStorage.getItem(MOCK_ROUTES_KEY)) {
    localStorage.setItem(MOCK_ROUTES_KEY, JSON.stringify(defaultRoutes));
  }
}

export function getMockRoute(lineNumber: string): MockRoute | null {
  const routes = JSON.parse(localStorage.getItem(MOCK_ROUTES_KEY) || '[]');
  return routes.find((r: MockRoute) => r.lineNumber === lineNumber) || null;
}

export function saveMockRoute(route: MockRoute) {
  const routes = JSON.parse(localStorage.getItem(MOCK_ROUTES_KEY) || '[]');
  const index = routes.findIndex((r: MockRoute) => r.lineNumber === route.lineNumber);
  
  if (index >= 0) {
    routes[index] = route;
  } else {
    routes.push(route);
  }
  
  localStorage.setItem(MOCK_ROUTES_KEY, JSON.stringify(routes));
}
```

## Estrutura Recomendada de Diretórios

```
src/
├── components/
│   ├── RouteMap.tsx
│   └── MapControls.tsx
├── services/
│   ├── api.ts              # Configuração base da API
│   ├── routeService.ts     # Serviço de rotas
│   ├── geocoding.ts        # Serviço de geocoding
│   └── sptrans.ts          # Integração SPTrans (se aplicável)
├── types/
│   ├── route.types.ts      # Tipos TypeScript para rotas
│   └── api.types.ts        # Tipos TypeScript para API
├── utils/
│   ├── mockData.ts         # Dados mockados
│   └── routeHelpers.ts     # Funções auxiliares
└── hooks/
    ├── useRouteData.ts     # Hook customizado para dados de rota
    └── useGeolocation.ts   # Hook para geolocalização
```

## Hook Customizado Exemplo

```typescript
// hooks/useRouteData.ts
import { useState, useEffect } from 'react';
import { fetchRouteData, RouteData } from '../services/api';

export function useRouteData(lineNumber: string | null) {
  const [data, setData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lineNumber) {
      setData(null);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const routeData = await fetchRouteData(lineNumber);
        setData(routeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [lineNumber]);

  return { data, loading, error };
}
```

**Uso:**

```tsx
function FleetPhotosPage() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const { data: routeData, loading, error } = useRouteData(selectedLine);

  return (
    <>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {routeData && <RouteMap routePoints={...} />}
    </>
  );
}
```

## Dicas de Performance

1. **Cache de Rotas**: Armazene rotas já buscadas
2. **Debounce**: Adicione debounce na busca
3. **Lazy Loading**: Carregue o mapa apenas quando necessário
4. **Simplificação**: Reduza pontos da rota se necessário
5. **Memoização**: Use React.memo para evitar re-renders

```typescript
// Com cache
const routeCache = new Map<string, RouteData>();

async function getCachedRoute(lineNumber: string): Promise<RouteData> {
  if (routeCache.has(lineNumber)) {
    return routeCache.get(lineNumber)!;
  }
  
  const data = await fetchRouteData(lineNumber);
  routeCache.set(lineNumber, data);
  return data;
}
```

## Próximos Passos

1. Escolha a fonte de dados mais adequada para seu caso
2. Implemente o serviço de busca
3. Adicione tratamento de erros robusto
4. Implemente cache e otimizações
5. Adicione testes unitários
6. Configure variáveis de ambiente para API keys
