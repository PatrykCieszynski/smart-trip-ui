import { Component } from '@angular/core';
import {LeafletMapComponent} from './leaflet-map/leaflet-map.component';
import {PlannerPanelComponent} from './planner-panel/planner-panel.component';

@Component({
  selector: 'app-root',
  imports: [
    LeafletMapComponent,
    PlannerPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

}
