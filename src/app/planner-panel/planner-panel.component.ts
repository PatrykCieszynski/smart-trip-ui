import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { debounceTime, switchMap, startWith, map } from 'rxjs/operators';
import {firstValueFrom, Observable, tap} from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {MapTilerCity, ApiGatewayService} from '../api-gateway-service/api-gateway.service';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import {LocationPoint, RoutePoints} from '../models/RoutePoints';
import {MatIconModule} from '@angular/material/icon';
import {CityAutocompleteComponent} from './components/city-autocomplete/city-autocomplete.component';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';

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
    CityAutocompleteComponent,
    DragDropModule
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

  constructor(private apiGatewayService: ApiGatewayService,
              private fb: FormBuilder,
              private cdr: ChangeDetectorRef) {
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

  removeMiddlePoint(index: number) {
    const point = this.routePoints.getWaypoints()[index];
    if (point) {
      this.leafletMap?.removeMarker(point);
      this.routePoints.removeWaypoint(point);
    }
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

  dropMiddlePoint(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.middlePointsFormArray.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.routePoints.getWaypoints(), event.previousIndex, event.currentIndex);
    this.middlePointsFormArray.updateValueAndValidity();
  }

  handleCitySelected(event: MatAutocompleteSelectedEvent, type: 'start' | 'end' | 'middle', index?: number) {
    const city = this.citiesToSelect.find(c => c.place_name === event.option.value);
    if (!city) return;
    const point: LocationPoint = {
      lat: city.geometry.coordinates[1],
      lng: city.geometry.coordinates[0],
      pointName: city.place_name
    };

    if (type === 'start') {
      point.formControl = this.fromFormControl;
      this.leafletMap?.addMarker(
        point,
        'start',
        undefined,
        'Start',
        this.leafletMap.startIcon,
        'form'
      );

    } else if (type === 'end') {
      point.formControl = this.toFormControl;
      this.leafletMap?.addMarker(
        point,
        'end',
        undefined,
        'Koniec',
        this.leafletMap.endIcon,
        'form'
      );

    } else if (type === 'middle') {
      point.formControl = this.middlePointsFormArray.at(index!);
      this.leafletMap?.addMarker(
        point,
        "middle",
        index,
        'Punkt pośredni',
        undefined,
        'form'
      );
    }
  }

  handlePointAddedFromMap(event: {point: LocationPoint, type: 'start' | 'end' | 'middle', dragged: boolean}) {
    const {point, type, dragged} = event;

    if (type === 'start') {
      this.updateFormControlWithLocationName(this.fromFormControl, point);
    }
    else if (type === 'end') {
      this.updateFormControlWithLocationName(this.toFormControl, point);
    }
    else if (type === 'middle') {
      if (dragged && point.formControl) {
        this.updateFormControlWithLocationName(point.formControl, point);
      } else {
        this.addMiddlePointForm();
        const lastIndex = this.middlePointsFormArray.length - 1;
        const newControl = this.middlePointsFormArray.at(lastIndex);
        if (newControl) {
          point.formControl = newControl;
          this.updateFormControlWithLocationName(newControl, point);
        }
      }
    }

    this.cdr.detectChanges();
  }

  async updateFormControlWithLocationName(control: FormControl<string>, point: LocationPoint) {
    try {
      const locationName = await firstValueFrom(this.apiGatewayService.getLocationName(point.lat, point.lng));
      control.setValue(locationName || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
      point.pointName = locationName || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      const coordsString = `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
      control.setValue(coordsString);
      point.pointName = coordsString;
    }
  }

  findRoute() {
    this.apiGatewayService.getRoute(this.routePoints).subscribe(route => {
      if (route) {
        this.leafletMap?.drawRoute(route);
      }
    });
  }
}
