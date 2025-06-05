import {Component, EventEmitter, Output} from '@angular/core';
import {control, latLng, MapOptions, tileLayer} from 'leaflet';
import {environment} from '../../environments/environment';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import {LocationPoint} from '../models/RoutePoints';

@Component({
  selector: 'leaflet-map',
  imports: [LeafletModule],
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss'
})
export class LeafletMapComponent {
  @Output() fromSelected = new EventEmitter<{ lat: number, lng: number }>();
  @Output() toSelected = new EventEmitter<{ lat: number, lng: number }>();

  map: L.Map | undefined;
  middleMarkers: L.Marker[] = [];

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

  startIcon = new L.Icon({
    iconUrl: 'media/marker-icon-green.png',
    shadowUrl: 'media/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  endIcon = new L.Icon({
    iconUrl: 'media/marker-icon-red.png',
    shadowUrl: 'media/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

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
            this.addMarker(lat, lng, {
              popupText: 'Start',
              icon: this.startIcon,
              markerRef: "start",
            });
            map.closePopup();
            this.fromSelected.emit({ lat, lng });
          };
        }
        if (toBtn) {
          toBtn.onclick = () => {
            this.addMarker(lat, lng, {
              popupText: 'Koniec',
              icon: this.endIcon,
              markerRef: "end",
            });
            map.closePopup();
            this.toSelected.emit({ lat, lng });
          };
        }
      }, 0);
    });
  }

  addMarker(
    lat: number,
    lng: number,
    options: {
      popupText?: string;
      icon?: L.Icon;
      routePoint?: LocationPoint;
      markerRef?: "start" | "end" | "index";
      middlePointIndex?: number;
    } = {}
  ): L.Marker {

    if (options.markerRef && (this as any)[options.markerRef]) {
      this.map?.removeLayer((this as any)[options.markerRef]);
    }

    const marker = L.marker([lat, lng], {
      draggable: true,
      ...(options.icon ? { icon: options.icon } : {})
    }).addTo(this.map!);

    if (options.popupText) {
      marker.bindPopup(options.popupText).openPopup();
    }

    marker.on('dragend', (event) => {
      const { lat, lng } = event.target.getLatLng();
      console.log('Marker dragged to', lat, lng);
      console.log(options);
      if (options.routePoint) {
        options.routePoint.lat = lat;
        options.routePoint.lng = lng;
      }
    });

    if (options.markerRef == "start" || options.markerRef == "end") {
      (this as any)[options.markerRef] = marker;
    } else {
      this.middleMarkers.push(marker);
    }

    return marker;
  }

  removeMarker(point: LocationPoint) {
    this.map?.removeLayer(point.marker!);
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
