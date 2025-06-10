import {Component, Input} from '@angular/core';
import {RouteResponse} from '../../../models/RouteResponse';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {NgIf} from '@angular/common';

@Component({
  selector: 'route-summary',
  imports: [
    MatIcon,
    MatCardTitle,
    MatCardHeader,
    MatCard,
    MatCardContent,
    NgIf
  ],
  templateUrl: './route-summary.component.html',
  styleUrl: './route-summary.component.scss'
})
export class RouteSummaryComponent {
  @Input() route: RouteResponse | null = null;

  get formattedDistance(): string {
    if (!this.route) return '';
    const km = this.route.totalDistance / 1000;
    return km >= 1 ? `${km.toFixed(1)} km` : `${this.route.totalDistance.toFixed(0)} m`;
  }

  get formattedDuration(): string {
    if (!this.route) return '';
    const totalMinutes = Math.round(this.route.totalDuration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  }

  get averageSpeed(): string {
    if (!this.route || this.route.totalDuration === 0) return '0';
    const kmPerHour = (this.route.totalDistance / 1000) / (this.route.totalDuration / 3600);
    return kmPerHour.toFixed(1);
  }
}

