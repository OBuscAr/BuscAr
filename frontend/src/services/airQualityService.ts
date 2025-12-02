import api from './api';

export interface AirQualityIndex {
  code: string;
  displayName: string;
  aqi: number;
  category: string;
}

export interface AirQualityData {
  indexes: AirQualityIndex[];
  health_recommendation: string;
}

export interface AirQualityResponse {
  latitude: number;
  longitude: number;
  air_quality: AirQualityData;
}

export const airQualityService = {
  async getAirQualityByAddress(address: string): Promise<AirQualityResponse> {
    const { data } = await api.post<AirQualityResponse>('/api/v1/air-quality-address', {
      address: address
    });
    return data;
  }
};
