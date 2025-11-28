import api from './api';

export interface RouteSegment {
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

export interface RouteOption {
  description: string;
  distance_km: number;
  emission_kg_co2: number;
  polyline: {
    encodedPolyline: string;
  };
  segments: RouteSegment[];
}

export interface RouteComparisonResponse {
  routes: RouteOption[];
}

export const routeComparisonService = {
  async compareRoutes(originAddress: string, destinationAddress: string): Promise<RouteComparisonResponse> {
    const { data } = await api.post<RouteComparisonResponse>('/api/v1/compare-bus-routes', {
      origin_address: originAddress,
      destination_address: destinationAddress
    });
    return data;
  }
};
