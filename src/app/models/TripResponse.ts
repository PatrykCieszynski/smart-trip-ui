import {RouteResponse} from './RouteResponse';
import {AiResponse} from './AiResponse';

export interface TripResponse {
  route: RouteResponse,
  ai: AiResponse
}
