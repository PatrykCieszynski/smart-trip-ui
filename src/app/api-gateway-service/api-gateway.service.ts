import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, tap} from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MapTilerCity {
  place_name: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  center: [number, number];
  bbox: [number, number, number, number];
}

@Injectable({
  providedIn: 'root'
})
export class ApiGatewayService {
  constructor(private http: HttpClient) {}

  searchCities(query: string): Observable<MapTilerCity[]> {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 1) {
      return of([]);
    }
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(trimmed)}.json?key=${environment.maptilerApiKey}&language=pl`;
    return this.http.get<any>(url).pipe(
      map(response =>
        (response.features || []).map((r: any) => ({
          place_name: r.place_name,
          geometry: {
            type: r.geometry.type,
            coordinates: r.geometry.coordinates
          },
          center: r.center,
          bbox: r.bbox
        }))
      ),
      tap(citySuggestions => console.log('City suggestions:', citySuggestions))
    );
  }

  getRoute(from: MapTilerCity, to: MapTilerCity): Observable<any> {
    const fromLng = from.geometry.coordinates[0];
    const fromLat = from.geometry.coordinates[1];
    const toLng = to.geometry.coordinates[0];
    const toLat = to.geometry.coordinates[1];
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${environment.openRouteServiceApiKey}&start=${fromLng},${fromLat}&end=${toLng},${toLat}`;
    return this.http.get<any>(url).pipe(
      tap(route => console.log('Route:', route))
    );
  }
}
