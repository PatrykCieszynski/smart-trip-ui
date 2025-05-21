import { Component } from '@angular/core';
import {control, latLng, MapOptions, tileLayer} from 'leaflet';
import {environment} from '../../environments/environment';
import {LeafletModule} from '@bluehalo/ngx-leaflet';

@Component({
  selector: 'leaflet-map',
  imports: [LeafletModule],
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss'
})
export class LeafletMapComponent {

  options: MapOptions = {
    layers: [
      tileLayer(`https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${environment.maptilerApiKey}`, {
        attribution: '&copy; MapTiler & OpenStreetMap contributors',
        tileSize: 512,
        zoomOffset: -1
      })
    ],
    zoom: 6,
    center: latLng(52.2297, 21.0122), // Warszawa
    zoomControl: false
  };

  onMapReady(map: L.Map) {
    control.zoom({ position: 'bottomright' }).addTo(map);
  }
}
