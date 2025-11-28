export interface Line {
  id: number;
  name: string;
  direction: 'MAIN' | 'SECONDARY';
  description?: string;
}

export interface Stop {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface EmissionStatistics {
  total_emission: number;
  total_distance: number;
  date: string;
}

export interface LineEmission {
  line: Line;
  emission: number;
  distance: number;
}

export interface LinesRankingResponse {
  lines_emissions: LineEmission[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}
