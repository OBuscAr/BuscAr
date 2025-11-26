export interface Line {
  id: number;
  name: string;
  direction: 'MAIN' | 'SECONDARY';
}

export interface Stop {
  id: number;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  sequence: number;
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
