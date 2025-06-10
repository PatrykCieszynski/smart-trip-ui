export interface RouteResponse {
  totalDistance: number;
  totalDuration: number;
  geometry: Array<{
    longitude: number;
    latitude: number;
  }>;
  query: {
    coordinates: Array<{
      longitude: number;
      latitude: number;
    }>;
  };
}
