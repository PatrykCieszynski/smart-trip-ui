import {Component, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
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
import {MatIconModule} from '@angular/material/icon';
import {CityAutocompleteComponent} from './components/city-autocomplete/city-autocomplete.component';

@Component({
  selector: 'planner-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    LeafletMapComponent,
    CityAutocompleteComponent
  ],
  templateUrl: './planner-panel.component.html',
  styleUrls: ['./planner-panel.component.scss']
})
export class PlannerPanelComponent implements OnInit {
  @ViewChild('leafletMap') leafletMap?: LeafletMapComponent;

  form: FormGroup;
  fromFormControl = new FormControl<string>('', { nonNullable: true });
  toFormControl = new FormControl<string>('', { nonNullable: true });
  middlePointsFormArray: FormArray<FormControl<string>>;

  filteredFromCities$!: Observable<string[]>;
  filteredMiddlePointCities$: Observable<string[]>[] = [];
  filteredToCities$!: Observable<string[]>;
  citiesToSelect: MapTilerCity[] = [];

  routePoints = new RoutePoints();

  constructor(private apiGatewayService: ApiGatewayService, private fb: FormBuilder) {
    this.middlePointsFormArray = this.fb.array<FormControl<string>>([]);
    this.form = this.fb.group({
      from: this.fromFormControl,
      to: this.toFormControl,
      middlePoints: this.middlePointsFormArray
    });
  }

  ngOnInit(): void {
    this.filteredFromCities$ = this.createCityFilter(this.fromFormControl, this.citiesToSelect);
    this.filteredToCities$ = this.createCityFilter(this.toFormControl, this.citiesToSelect);
  }

  addMiddlePointForm() {
    const ctrl = this.fb.control('', { nonNullable: true });
    this.middlePointsFormArray.push(ctrl);
    this.filteredMiddlePointCities$.push(
      ctrl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        switchMap(value => this.apiGatewayService.searchCities(value ?? '')),
        tap(cities => this.citiesToSelect = cities),
        map(cities => cities.map(city => city.place_name))
      )
    );
  }

  removeMiddlePointForm(index: number) {
    this.middlePointsFormArray.removeAt(index);
    this.filteredMiddlePointCities$.splice(index, 1);
  }

  createCityFilter(control: FormControl<string>, citiesRef: MapTilerCity[]): Observable<string[]> {
    return control.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.apiGatewayService.searchCities(value)),
      tap(cities => {
        citiesRef.splice(0, citiesRef.length, ...cities);
        this.citiesToSelect = cities; //
      }),
      map(cities => cities.map(city => city.place_name))
    );
  }

  handleCitySelected(event: MatAutocompleteSelectedEvent, type: 'from' | 'to' | 'middle') {
    const city = this.citiesToSelect.find(c => c.place_name === event.option.value);
    if (!city) return;
    const point = {
      lat: city.geometry.coordinates[1],
      lng: city.geometry.coordinates[0],
      pointName: city.place_name
    };

    if (type === 'from') {
      this.routePoints.setStart(point);
      this.leafletMap?.addFromMarker(point.lat, point.lng);
    } else if (type === 'to') {
      this.routePoints.setEnd(point);
      this.leafletMap?.addToMarker(point.lat, point.lng);
    } else if (type === 'middle') {
      this.routePoints.addWaypoint(point);
      this.leafletMap?.addMiddleMarker(point.lat, point.lng);
    }
  }

  onLocationPicked(event: { lat: number, lng: number }, isFrom: boolean) {
    // TODO Update the form control with the selected coordinates (or even some vague location name)
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
