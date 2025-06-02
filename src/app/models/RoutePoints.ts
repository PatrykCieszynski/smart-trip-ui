import {L} from '@angular/cdk/keycodes';

export interface LocationPoint {
  lat: number;
  lng: number;
  pointName?: string;
  marker?: L.Marker;
}

export class RoutePoints {
  startPoint?: LocationPoint;
  endPoint?: LocationPoint;
  private waypoints: LocationPoint[] = [];

  getStart(): LocationPoint | undefined {
    return this.startPoint;
  }

  setStart(point: LocationPoint) {
    this.startPoint = point;
  }

  getEnd(): LocationPoint | undefined {
    return this.endPoint;
  }

  setEnd(point: LocationPoint) {
    this.endPoint = point;
  }

  getWaypoints(): LocationPoint[] {
    return this.waypoints;
  }

  addWaypoint(point: LocationPoint) {
    this.waypoints.push(point);
  }

  removeWaypoint(point: LocationPoint) {
    this.waypoints = this.waypoints.filter(p => p !== point);
  }

  get all(): LocationPoint[] {
    return [
      ...(this.startPoint ? [this.startPoint] : []),
      ...this.waypoints,
      ...(this.endPoint ? [this.endPoint] : [])
    ];
  }

  getAllCoordinates(): [number, number][] {
    return this.all.map(point => [point.lng, point.lat]);
  }


}
