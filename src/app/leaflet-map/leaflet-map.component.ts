import { Component } from '@angular/core';
import {control, latLng, MapOptions, tileLayer} from 'leaflet';
import {environment} from '../../environments/environment';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';

@Component({
  selector: 'leaflet-map',
  imports: [LeafletModule],
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss'
})
export class LeafletMapComponent {
  map: L.Map | undefined;

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
    this.map = map;
    control.zoom({ position: 'bottomright' }).addTo(map);
  }

  addFromMarker(lat: number, lng: number) {
    console.log(`Adding marker at lat: ${lat}, lng: ${lng}`);
    const marker = L.marker([lat, lng]).addTo((this.map as any));
    marker.bindPopup('From Location').openPopup();
  }

  addToMarker(lat: number, lng: number) {
    console.log(`Adding marker at lat: ${lat}, lng: ${lng}`);
    const marker = L.marker([lat, lng]).addTo((this.map as any));
    marker.bindPopup('To Location').openPopup();
  }

  drawRoute(route: any) {
    if (!route || !route.features || !route.features[0]?.geometry?.coordinates) {
      console.warn('Brak danych do narysowania trasy');
      return;
    }
    if ((this as any).routeLayer) {
      this.map?.removeLayer((this as any).routeLayer);
    }
    const coords = route.features[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    (this as any).routeLayer = L.polyline(coords, { color: 'blue', weight: 5 }).addTo(this.map!);
    this.map?.fitBounds((this as any).routeLayer.getBounds());
  }
}
