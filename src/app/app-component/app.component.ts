import { Component } from '@angular/core';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import {marker, icon, tileLayer, latLng, MapOptions, Marker} from 'leaflet';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-root',
  imports: [LeafletModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'smart-trip-ui';

  options: MapOptions = {
    layers: [
      tileLayer(`https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${environment.maptilerApiKey}`, {
        attribution: '&copy; MapTiler & OpenStreetMap contributors',
        tileSize: 512,
        zoomOffset: -1
      })
    ],
    zoom: 6,
    center: latLng(52.2297, 21.0122) // Warszawa
  };

  markers: Marker[] = [
    marker([52.2297, 21.0122], {
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png'
      })
    })
  ];
}
