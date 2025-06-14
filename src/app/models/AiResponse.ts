export interface AiResponse {
  answer: string;
  success: boolean;
  errorMessage: string | null;
  suggestions: {
    title: string;
    description: string;
    type: string | null;
    location: {
      name: string;
      address: string | null;
      latitude: number;
      longitude: number;
      locationType: string | null;
    };
    estimatedCost: number | null;
    estimatedDuration: string | null;
    priority: number | null;
  }[];
  locations: {
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    locationType: string | null;
  }[];
  metadata: {
    estimatedBudget: number | null;
    estimatedDuration: string | null;
    transportMode: string | null;
    tags: string[] | null;
    season: string | null;
  };
}
