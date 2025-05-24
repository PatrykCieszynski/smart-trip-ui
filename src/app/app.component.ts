import { Component } from '@angular/core';
import {PlannerPanelComponent} from './planner-panel/planner-panel.component';

@Component({
  selector: 'app-root',
  imports: [
    PlannerPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

}
