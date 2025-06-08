import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/planner', pathMatch: 'full' },
  { path: 'planner', loadComponent: () => import('./planner-panel/planner-panel.component').then(m => m.PlannerPanelComponent) },
];
