import {Component, OnInit, ViewChild} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, switchMap, startWith, map } from 'rxjs/operators';
import {Observable, tap} from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {MapTilerCity, ApiGatewayService} from '../api-gateway-service/api-gateway.service';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import {RoutePoints} from '../models/RoutePoints';

@Component({
  selector: 'planner-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    LeafletMapComponent
  ],
  templateUrl: './planner-panel.component.html',
  styleUrls: ['./planner-panel.component.scss']
})
export class PlannerPanelComponent implements OnInit {
  @ViewChild('leafletMap') leafletMap?: LeafletMapComponent;

  fromControl = new FormControl<string>('', { nonNullable: true });
  toControl = new FormControl<string>('', { nonNullable: true });
  filteredFromCities$!: Observable<string[]>;
  filteredToCities$!: Observable<string[]>;
  allFromCities: MapTilerCity[] = [];
  allToCities: MapTilerCity[] = [];
  routePoints = new RoutePoints();

  constructor(private apiGatewayService: ApiGatewayService) {}

  ngOnInit(): void {
    this.filteredFromCities$ = this.createCityFilter(this.fromControl, this.allFromCities);
    this.filteredToCities$ = this.createCityFilter(this.toControl, this.allToCities);
  }

  private createCityFilter(control: FormControl<string>, citiesRef: MapTilerCity[]): Observable<string[]> {
    return control.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.apiGatewayService.searchCities(value)),
      tap(cities => citiesRef.splice(0, citiesRef.length, ...cities)),
      map(cities => cities.map(city => city.place_name))
    );
  }

  onCitySelected(event: MatAutocompleteSelectedEvent, isFrom: boolean) {
    const cities = isFrom ? this.allFromCities : this.allToCities;
    const city = cities.find(c => c.place_name === event.option.value);
    if (city) {
      const point = { lat: city.geometry.coordinates[1], lng: city.geometry.coordinates[0], pointName: city.place_name };
      isFrom ? this.routePoints.setStart(point) : this.routePoints.setEnd(point);
      isFrom
        ? this.leafletMap?.addFromMarker(point.lat, point.lng)
        : this.leafletMap?.addToMarker(point.lat, point.lng);
    }
  }

  onLocationPicked(event: { lat: number, lng: number }, isFrom: boolean) {
    //
    const point = { lat: event.lat, lng: event.lng };
    isFrom ? this.routePoints.setStart(point) : this.routePoints.setEnd(point);
  }

  findRoute() {
    this.apiGatewayService.getRoute(this.routePoints).subscribe(route => {
      if (route) {
        console.log(route);
        this.leafletMap?.drawRoute(route);
      }
    });
  }
}
