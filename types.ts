
export interface CountryData {
  id: string;
  name: string;
  population: number;
  gdp: number;
  militaryPower: number;
  stability: number;
  researchPoints: number;
  isPlayer: boolean;
  color: string;
  ownerId: string;
  territoryPaths: any[]; // SVG paths
}

export interface GameState {
  playerCountryId: string | null;
  selectedCountryId: string | null;
  money: number;
  researchTotal: number;
  day: number;
  isPaused: boolean;
  news: NewsEvent[];
}

export interface NewsEvent {
  id: string;
  message: string;
  type: 'war' | 'economy' | 'diplomacy' | 'world';
  timestamp: number;
}

export interface MapFeature {
  type: string;
  id: string;
  properties: {
    name: string;
  };
  geometry: any;
}
