import {Component, EventEmitter, Input, Output} from '@angular/core';
import {control, latLng, MapOptions, tileLayer} from 'leaflet';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import * as L from 'leaflet';
import {LocationPoint, RoutePoints} from '../../../models/RoutePoints';
import {RouteResponse} from '../../../models/RouteResponse';

@Component({
  selector: 'leaflet-map',
  imports: [LeafletModule],
  templateUrl: './leaflet-map.component.html',
  styleUrl: './leaflet-map.component.scss'
})
export class LeafletMapComponent {
  @Input() routePoints!: RoutePoints;

  @Output() pointModifiedByMap = new EventEmitter<{point: LocationPoint, type: 'start' | 'end' | 'middle', dragged: boolean}>();

  map: L.Map | undefined;
  isPopoupOpen: boolean = false;
  mapRoute?: L.Polyline;
  mapAiTrip?: L.Polyline;
  aiSuggestionMarkers: L.Marker[] = [];

  options: MapOptions = {
    layers: [
      tileLayer(`/api/v1/map/{z}/{x}/{y}.png`, {
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

  aiSuggestionIcon = new L.Icon({
    iconUrl: 'media/marker-icon-yellow.png', // Dodaj tutaj odpowiednią ścieżkę/kolor
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
      if (this.isPopoupOpen) {
        map.closePopup();
        this.isPopoupOpen = false;
        return;
      }

      const { lat, lng } = e.latlng;
      const popupContent = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="set-from-btn" type="button" style="padding: 8px 12px; border: none; background: #4CAF50; color: white; border-radius: 4px; cursor: pointer;">
          Ustaw punkt startowy
        </button>
        <button id="set-middle-btn" type="button" style="padding: 8px 12px; border: none; background: #2196F3; color: white; border-radius: 4px; cursor: pointer;">
          Dodaj punkt pośredni
        </button>
        <button id="set-to-btn" type="button" style="padding: 8px 12px; border: none; background: #f44336; color: white; border-radius: 4px; cursor: pointer;">
          Ustaw punkt końcowy
        </button>
      </div>

    `;
      L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);
      this.isPopoupOpen = true

      setTimeout(() => {
        const fromBtn = document.getElementById('set-from-btn');
        const middleBtn = document.getElementById('set-middle-btn')
        const toBtn = document.getElementById('set-to-btn');

        const point: LocationPoint = {
          lat: lat,
          lng: lng
        };

        this.handlePopupButtonClick(fromBtn, "start", point, map, this.startIcon);
        this.handlePopupButtonClick(middleBtn ,"middle", point, map);
        this.handlePopupButtonClick(toBtn ,"end", point, map, this.endIcon);
      }, 0);
    });
  }

  handlePopupButtonClick(
    button: HTMLElement | null,
    type: 'start' | 'middle' | 'end',
    point: LocationPoint,
    map: L.Map,
    icon?: L.Icon
  ): void {
    if (button) {
      button.onclick = () => {
        this.manageMarker(point, type, undefined, point.pointName, icon, 'map');
        this.isPopoupOpen = false;
        map.closePopup();
      }
    }
  }

  manageMarker(
      routePoint: LocationPoint,
      markerRef: "start" | "end" | "middle",
      index?: number,
      popupText?: string,
      icon?: L.Icon,
      source?: "map" | "form"
  ) {

    if (this.moveMarkerIfExist(markerRef, routePoint, index)) {
      const type = markerRef as 'start' | 'end';
      if (source == "map") {
        this.pointModifiedByMap.emit({point: routePoint, type, dragged: false});
      }
      return;
    }

    const marker = L.marker([routePoint?.lat, routePoint?.lng], {
      draggable: true,
      ...(icon ? { icon: icon } : {})
    }).addTo(this.map!);

    if (popupText) {
      marker.bindPopup(popupText).openPopup();
    }

    marker.on('dragend', (event) => {
      const { lat, lng } = event.target.getLatLng();
      if (routePoint) {
        routePoint.lat = lat;
        routePoint.lng = lng;
        const type = markerRef === 'start' ? 'start' : markerRef === 'end' ? 'end' : 'middle';
        this.pointModifiedByMap.emit({point: routePoint, type, dragged: true});
      }
    });

    if (routePoint) {
      routePoint.marker = marker;
    }

    if (markerRef == "start") {
      this.routePoints?.setStart(routePoint!);
      if (source == "map") {
        this.pointModifiedByMap.emit({point: routePoint, type: 'start', dragged: false});
      }
    }
    else if (markerRef == "end") {
      this.routePoints?.setEnd(routePoint!);
      if (source == "map") {
        this.pointModifiedByMap.emit({point: routePoint, type: 'end', dragged: false});
      }
    }
    else if (markerRef == "middle") {
      this.routePoints?.addWaypoint(routePoint!);
      if (source == "map") {
        this.pointModifiedByMap.emit({point: routePoint, type: 'middle', dragged: false});
      }
    }
  }

  moveMarkerIfExist(markerRef: string, routePoint: LocationPoint, index?: number): boolean {
    if(markerRef == "start" && this.routePoints?.getStart()) {
      const start = this.routePoints.getStart()!;
      start.marker!.setLatLng([routePoint.lat, routePoint.lng]);
      start.lat = routePoint.lat;
      start.lng = routePoint.lng;
      return true;
    }
    else if(markerRef == "end" && this.routePoints?.getEnd()) {
      const end = this.routePoints.getEnd()!;
      end.marker!.setLatLng([routePoint.lat, routePoint.lng]);
      end.lat = routePoint.lat;
      end.lng = routePoint.lng;
      return true;
    }
    else if(markerRef == "middle" && index != undefined) {
      if (this.routePoints.getWaypoints()[index]) {
        const point = this.routePoints.getWaypoints()[index];
        point.marker!.setLatLng([routePoint.lat, routePoint.lng]);
        point.lat = routePoint.lat;
        point.lng = routePoint.lng;
        return true;
      }
    }
    return false;
  }

  removeMarker(point: LocationPoint) {
    this.map?.removeLayer(point.marker!);
  }

  drawRoute(route: RouteResponse) {
    if (!route || !route?.geometry?.length) {
      console.warn('Brak danych geometrii trasy do narysowania');
      return;
    }

    if (this.mapRoute) {
      this.map?.removeLayer(this.mapRoute);
    }
    const coords = route.geometry.map((point) =>
      [point.latitude, point.longitude] as [number, number]
    );

    this.mapRoute = L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.8
    }).addTo(this.map!);
    this.map?.fitBounds(this.mapRoute.getBounds());
  }

  drawTrip(route: RouteResponse) {
    if (!route || !route?.geometry?.length) {
      console.warn('Brak danych geometrii trasy do narysowania');
      return;
    }

    if (this.mapAiTrip) {
      this.map?.removeLayer(this.mapAiTrip);
    }
    const coords = route.geometry.map((point) =>
      [point.latitude, point.longitude] as [number, number]
    );

    this.mapAiTrip = L.polyline(coords, { color: '#FFB566', weight: 5, opacity: 0.8
    }).addTo(this.map!);
    this.map?.fitBounds(this.mapAiTrip.getBounds());
  }

  clearRoutes() {
    if (this.mapRoute) {
      this.map?.removeLayer(this.mapRoute);
    }
    if (this.mapAiTrip) {
      this.map?.removeLayer(this.mapAiTrip);
    }
    if (this.aiSuggestionMarkers.length) {
      this.aiSuggestionMarkers.forEach(marker => this.map?.removeLayer(marker));
    }
  }

  clearAllMarkers() {
    this.map?.eachLayer((layer: L.Layer) => {
      // Usuwaj tylko markery (nie usuń np. podkładów)
      if (layer instanceof L.Marker) {
        this.map?.removeLayer(layer);
      }
    });

  }

  showAiSuggestionPoints(points: LocationPoint[]) {
    // Usuń stare markery, jeśli są
    this.aiSuggestionMarkers.forEach(marker => this.map?.removeLayer(marker));
    this.aiSuggestionMarkers = [];

    points.forEach(point => {
      const marker = L.marker([point.lat, point.lng], {
        icon: this.aiSuggestionIcon,
        draggable: false // lub true jeśli potrzebne
      });
      marker.bindPopup(point.pointName || "Sugestia AI");
      marker.addTo(this.map!);
      this.aiSuggestionMarkers.push(marker);
    });
  }

}
