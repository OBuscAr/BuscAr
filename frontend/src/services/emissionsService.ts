import api from './api';
import type { 
  EmissionStatistics, 
  LinesRankingResponse 
} from '../types/api.types';

export const emissionsService = {
  async getLinesRanking(date: string, page = 1, pageSize = 20): Promise<LinesRankingResponse> {
    const { data } = await api.get<LinesRankingResponse>('/emissions/lines', {
      params: { date, page, page_size: pageSize }
    });
    return data;
  },

  async getOverallStatistics(startDate: string, daysRange: number): Promise<EmissionStatistics[]> {
    const { data } = await api.get<EmissionStatistics[]>('/emissions/lines/statistics', {
      params: { start_date: startDate, days_range: daysRange }
    });
    return data;
  },

  async getLineStatistics(lineId: number, startDate: string, daysRange: number): Promise<EmissionStatistics[]> {
    const { data } = await api.get<EmissionStatistics[]>(`/emissions/lines/${lineId}/statistics`, {
      params: { start_date: startDate, days_range: daysRange }
    });
    return data;
  },

  async getTotalLineEmission(lineNumber: string): Promise<{ line: { id: number; name: string; direction: string; description?: string }; emission: number; distance: number }[]> {
    const { data } = await api.get(`/emissions/lines/total`, {
      params: { line_number: lineNumber }
    });
    return data;
  }
};
