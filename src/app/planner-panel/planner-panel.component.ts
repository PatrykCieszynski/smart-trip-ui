import {Component, ViewChild} from '@angular/core';
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
export class PlannerPanelComponent {
  @ViewChild('leafletMap') leafletMap?: LeafletMapComponent;

  fromControl = new FormControl<string>('', { nonNullable: true });
  toControl = new FormControl<string>('', { nonNullable: true });

  filteredFromCities$: Observable<string[]>;
  filteredToCities$: Observable<string[]>;

  selectedFromCity?: MapTilerCity;
  selectedToCity?: MapTilerCity;
  allFromCities: MapTilerCity[] = [];
  allToCities: MapTilerCity[] = [];

  constructor(private apiGatewayService: ApiGatewayService) {
    this.filteredFromCities$ = this.fromControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.apiGatewayService.searchCities(value)),
      tap(cities => this.allFromCities = cities),
      map(cities => cities.map(city => city.place_name))
    );
    this.filteredToCities$ = this.toControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.apiGatewayService.searchCities(value)),
      tap(cities => this.allToCities = cities),
      map(cities => cities.map(city => city.place_name))
    );
  }

  onFromSelected(event: MatAutocompleteSelectedEvent) {
    const city = this.allFromCities.find(c => c.place_name === event.option.value);
    if (city) {
      this.selectedFromCity = city;
      console.log(city);
      this.leafletMap?.addFromMarker(city.geometry.coordinates[1], city.geometry.coordinates[0]);
    }
  }

  onToSelected(event: MatAutocompleteSelectedEvent) {
    const city = this.allToCities.find(c => c.place_name === event.option.value);
    if (city) {
      this.selectedToCity = city;
      console.log(city);
      this.leafletMap?.addToMarker(city.geometry.coordinates[1], city.geometry.coordinates[0]);
    }
  }

  findRoute() {
    if (this.selectedFromCity && this.selectedToCity) {
      this.apiGatewayService.getRoute(this.selectedFromCity, this.selectedToCity).subscribe(route => {
        console.log('Route found:', route);
        if (route) {
          this.leafletMap?.drawRoute(route);
        }
      });
    } else {
      console.warn('Please select both from and to locations.');
    }
  }

}
