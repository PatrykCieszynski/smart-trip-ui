import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, tap} from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {RoutePoints} from '../../../models/RoutePoints';
import {CityAutocompleteResponse} from '../../../models/CityAutocompleteResponse';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly citySearchUrl = '/api/v1/map/cities/autocomplete';

  constructor(private http: HttpClient) {}

  searchCities(query: string): Observable<CityAutocompleteResponse[]> {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 1) {
      return of([]);
    }
    console.log(`${this.citySearchUrl}?query=${encodeURIComponent(trimmed)}`);

    return this.http.get<CityAutocompleteResponse[]>(`${this.citySearchUrl}?query=${encodeURIComponent(trimmed)}`).pipe(
      tap(cities => console.log('City suggestions from backend:', cities))
    );
  }


  getLocationName(lat: number, lng: number): Observable<string> {
    const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${environment.maptilerApiKey}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.features && response.features.length > 0) {
          return response.features[0].place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }),
      tap(locationName => console.log('Location name:', locationName))
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
