import api from './api';

export interface RouteStop {
  id: number;
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export interface RouteLine {
  id: number;
  name: string;
}

export interface UserRoute {
  id: string;
  line: RouteLine;
  departure_stop: RouteStop;
  arrival_stop: RouteStop;
  distance: number;
  emission: number;
  emission_saving: number;
  created_at: string;
}

export interface CreateRouteRequest {
  line_id: number;
  departure_stop_id: number;
  arrival_stop_id: number;
}

export const routesService = {
  async getRoutes(): Promise<UserRoute[]> {
    const { data } = await api.get('/routes');
    return data;
  },

  async createRoute(route: CreateRouteRequest): Promise<UserRoute> {
    const { data } = await api.post('/routes', null, {
      params: {
        line_id: route.line_id,
        departure_stop_id: route.departure_stop_id,
        arrival_stop_id: route.arrival_stop_id,
      }
    });
    return data;
  },

  async deleteRoute(routeId: string): Promise<void> {
    await api.delete(`/routes/${routeId}`);
  }
};
