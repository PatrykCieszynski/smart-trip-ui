import { Injectable } from '@angular/core';
import {Observable, tap} from 'rxjs';
import {RoutePoints} from '../../../models/RoutePoints';
import {HttpClient} from '@angular/common/http';
import {TripResponse} from '../../../models/TripResponse';

@Injectable({
  providedIn: 'root'
})
export class TripPlannerService {
  private readonly tripPlannerURL = '/api/v1/trip/';

  constructor(private http: HttpClient) { }

  getTrip(routePoints: RoutePoints): Observable<TripResponse> {
    const request = routePoints.createRouteRequest();
    return this.http.post<TripResponse>(this.tripPlannerURL + 'route-with-ai', request).pipe(
      tap(response => console.log('Trip response: ', response)),
    );
  }
}
