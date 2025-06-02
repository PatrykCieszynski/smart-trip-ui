import {Component, EventEmitter, Output} from '@angular/core';
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
  @Output() fromSelected = new EventEmitter<{ lat: number, lng: number }>();
  @Output() toSelected = new EventEmitter<{ lat: number, lng: number }>();

  @Output() fromMoved = new EventEmitter<{ lat: number, lng: number }>();
  @Output() toMoved = new EventEmitter<{ lat: number, lng: number }>();

  map: L.Map | undefined;
  fromMarker: L.Marker | undefined;
  middleMarkers: L.Marker[] = [];
  toMarker: L.Marker | undefined;

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

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const popupContent = `
      <div>
        <button id="set-from-btn" type="button">Ustaw punkt startowy</button><br/>
        <button id="set-to-btn" type="button">Ustaw punkt końcowy</button>
      </div>
    `;
      L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);

      setTimeout(() => {
        const fromBtn = document.getElementById('set-from-btn');
        const toBtn = document.getElementById('set-to-btn');
        if (fromBtn) {
          fromBtn.onclick = () => {
            this.addFromMarker(lat, lng);
            map.closePopup();
            this.fromSelected.emit({ lat, lng });
          };
        }
        if (toBtn) {
          toBtn.onclick = () => {
            this.addToMarker(lat, lng);
            map.closePopup();
            this.toSelected.emit({ lat, lng });
          };
        }
      }, 0);
    });
  }


  addFromMarker(lat: number, lng: number) {
    if (this.fromMarker) {
      this.map?.removeLayer(this.fromMarker);
    }

    this.fromMarker = L.marker([lat, lng], {draggable: true}).addTo((this.map as any));
    this.fromMarker.bindPopup('From Location').openPopup();
    this.fromMarker.on('dragend', (event: L.DragEndEvent) => {
      const { lat, lng } = event.target.getLatLng();
      this.fromMoved.emit({ lat, lng });
    });
  }

  addToMarker(lat: number, lng: number) {
    if (this.toMarker) {
      this.map?.removeLayer(this.toMarker);
    }

    this.toMarker = L.marker([lat, lng], {draggable: true}).addTo((this.map as any));
    this.toMarker.bindPopup('To Location').openPopup();
    this.toMarker.on('dragend', (event: L.DragEndEvent) => {
      const { lat, lng } = event.target.getLatLng();
      this.toMoved.emit({ lat, lng });
    })
  }

  addMiddleMarker(lat: number, lng: number) {
    console.log('addMiddleMarker', lat, lng);
    const marker = L.marker([lat, lng], {draggable: true}).addTo((this.map as any));
    marker.bindPopup('Middle Location').openPopup();
    marker.on('dragend', (event: L.DragEndEvent) => {})
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
