import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { debounceTime, switchMap, startWith, map } from 'rxjs/operators';
import {firstValueFrom, Observable, tap} from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MapService} from '../shared/service/map/map.service';
import { LeafletMapComponent } from './components/leaflet-map/leaflet-map.component';
import {LocationPoint, RoutePoints} from '../models/RoutePoints';
import {MatIconModule} from '@angular/material/icon';
import {CityAutocompleteComponent} from './components/city-autocomplete/city-autocomplete.component';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {CityAutocompleteResponse} from '../models/CityAutocompleteResponse';
import {RouteResponse} from '../models/RouteResponse';
import {RouteSummaryComponent} from './components/route-summary/route-summary.component';
import {Message} from '../models/Message';
import {AssistantPanelComponent} from './components/assistant-panel/assistant-panel.component';
import {TripResponse} from '../models/TripResponse';

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
    DragDropModule,
    RouteSummaryComponent,
    AssistantPanelComponent
  ],
  templateUrl: './planner-panel.component.html',
  styleUrls: ['./planner-panel.component.scss']
})
export class PlannerPanelComponent implements OnInit {
  @ViewChild('leafletMap') leafletMap?: LeafletMapComponent;
  @ViewChild('assistantPanelRef') assistantPanel?: AssistantPanelComponent;

  form: FormGroup;
  fromFormControl = new FormControl<string>('', { nonNullable: true });
  toFormControl = new FormControl<string>('', { nonNullable: true });
  middlePointsFormArray: FormArray<FormControl<string>>;

  filteredFromCities$!: Observable<string[]>;
  filteredMiddlePointCities$: Observable<string[]>[] = [];
  filteredToCities$!: Observable<string[]>;
  citiesToSelect: CityAutocompleteResponse[] = [];

  routePoints = new RoutePoints();
  AiPoints : LocationPoint[] = [];

  routeResponse: RouteResponse | null = null;
  tripResponse: TripResponse | null = null;

  chatHistory: Message[] = [];
  isAssistantOpen = false;

  constructor(private apiGatewayService: MapService,
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
        map(cities => cities.map(city => city.name))
      )
    );
  }

  removeMiddlePoint(index: number) {
    const controlForm = this.middlePointsFormArray.at(index);

    const point = this.routePoints.getWaypoints().find(wp => wp.formControl === controlForm)
    if (point) {
      this.leafletMap?.removeMarker(point);
      this.routePoints.removeWaypoint(point);
    }
    this.middlePointsFormArray.removeAt(index);
    this.middlePointsFormArray.updateValueAndValidity();
    this.filteredMiddlePointCities$.splice(index, 1);
    this.cdr.detectChanges();
  }

  createCityFilter(control: FormControl<string>, citiesRef: CityAutocompleteResponse[]): Observable<string[]> {
    return control.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.apiGatewayService.searchCities(value)),
      tap(cities => {
        citiesRef.splice(0, citiesRef.length, ...cities);
        this.citiesToSelect = cities; //
      }),
      map(cities => cities.map(city => city.name))
    );
  }

  dropMiddlePoint(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.middlePointsFormArray.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.routePoints.getWaypoints(), event.previousIndex, event.currentIndex);
    this.middlePointsFormArray.updateValueAndValidity();
  }

  handleSelectedCity(event: MatAutocompleteSelectedEvent, type: 'start' | 'end' | 'middle', index?: number) {
    const city = this.citiesToSelect.find(c => c.name === event.option.value);
    if (!city) return;
    const point: LocationPoint = {
      lat: city.latitude,
      lng: city.longitude,
      pointName: city.name,
    };

    if (type === 'start') {
      point.formControl = this.fromFormControl;
      this.leafletMap?.manageMarker(
        point,
        'start',
        undefined,
        'Start',
        this.leafletMap.startIcon,
        'form'
      );

    } else if (type === 'end') {
      point.formControl = this.toFormControl;
      this.leafletMap?.manageMarker(
        point,
        'end',
        undefined,
        'Koniec',
        this.leafletMap.endIcon,
        'form'
      );

    } else if (type === 'middle') {
      point.formControl = this.middlePointsFormArray.at(index!);
      this.leafletMap?.manageMarker(
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
      const locationName: CityAutocompleteResponse = await firstValueFrom(this.apiGatewayService.getLocationName(point.lat, point.lng));
      control.setValue(locationName.name);
      point.pointName = locationName.name;
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
        this.routeResponse = route;
        this.leafletMap?.drawRoute(route);
      }
    });
  }

  findTrip() {
     this.assistantPanel?.proposeAssistance(this.routePoints).subscribe(trip => {
       if (trip) {
         this.tripResponse = trip;
         this.leafletMap?.drawRoute(trip.route);
       }
     });
  }
}
