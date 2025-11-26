import api from './api';
import type { Line, Stop } from '../types/api.types';

export const linesService = {
  async searchLines(term?: string): Promise<Line[]> {
    const { data } = await api.get<Line[]>('/lines', {
      params: term ? { term } : {}
    });
    return data;
  },

  async getLineStops(lineId: number): Promise<Stop[]> {
    const { data } = await api.get<Stop[]>(`/lines/${lineId}/stops`);
    return data;
  }
};
