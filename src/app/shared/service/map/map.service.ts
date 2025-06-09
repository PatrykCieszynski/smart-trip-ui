import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {EMPTY, Observable, tap} from 'rxjs';
import { environment } from '../../../../environments/environment';
import {RoutePoints} from '../../../models/RoutePoints';
import {CityAutocompleteResponse} from '../../../models/CityAutocompleteResponse';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly citySearchUrl = '/api/v1/map/cities/autocomplete';
  private readonly nameByCoordsUrl = '/api/v1/map/cities/name-by-coords';

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

  getRoute(routePoints: RoutePoints): Observable<any> {
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
    const body = {
      coordinates: routePoints.getAllCoordinates()
    };
    console.log(body);
    const headers = {
      'Authorization': environment.openRouteServiceApiKey,
      'Content-Type': 'application/json'
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      tap(route => console.log('Route:', route)),
    );
  }
}
