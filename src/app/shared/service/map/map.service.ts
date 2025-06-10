import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {EMPTY, Observable, tap} from 'rxjs';
import {RoutePoints} from '../../../models/RoutePoints';
import {CityAutocompleteResponse} from '../../../models/CityAutocompleteResponse';
import {RouteResponse} from '../../../models/RouteResponse';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly citySearchUrl = '/api/v1/map/cities/autocomplete';
  private readonly nameByCoordsUrl = '/api/v1/map/cities/name-by-coords';
  private readonly routeUrl = '/api/v1/map/route';

  constructor(private http: HttpClient) {}

  searchCities(query: string): Observable<CityAutocompleteResponse[]> {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 1) {
      return EMPTY
    }

    return this.http.get<CityAutocompleteResponse[]>(`${this.citySearchUrl}?query=${encodeURIComponent(trimmed)}`).pipe(
      tap(cities => console.log('City suggestions from backend:', cities))
    );
  }

  getLocationName(lat: number, lng: number): Observable<CityAutocompleteResponse> {
    return this.http.get<CityAutocompleteResponse>(`${this.nameByCoordsUrl}?lat=${lat}&lng=${lng}`).pipe(
      tap(cities => console.log('Place suggestion from backend:', cities))
    );
  }

  getRoute(routePoints: RoutePoints): Observable<RouteResponse> {
    const request = routePoints.createRouteRequest();
    return this.http.post<RouteResponse>(`${this.routeUrl}`, request).pipe(
      tap(route => console.log('Route:', route)),
    );
  }
}
