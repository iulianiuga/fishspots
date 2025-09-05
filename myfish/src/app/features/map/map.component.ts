import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- adaugă acest import
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';

import Map from 'ol/Map';
import View from 'ol/View';

import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';

import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { fromLonLat, transformExtent } from 'ol/proj';

import { apply } from 'ol-mapbox-style';
import GeoJSON from 'ol/format/GeoJSON';

import { AppSettingsService } from '../../app-settings.service';




@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  imports: [
    CommonModule,
    OverlayPanelModule, // <-- PrimeNG OverlayPanel
    ButtonModule        // <-- PrimeNG Button
  ]
})


export class MapComponent implements AfterViewInit, OnDestroy {
  badgeOpen = false;

  toggleBadge() {
    this.badgeOpen = !this.badgeOpen;
  }

  constructor(private settings: AppSettingsService) {}

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  private map!: Map;
  private resetHandler = () => this.resetView();

  ngAfterViewInit(): void {
    // Config inițial
    const styleUrl = this.settings.mapStyleUrl;// 'http://192.168.3.106:8125/styles/sbu01/style.json';
    const initialZoom = 6.72;
    const initialCenter = fromLonLat([25.809, 44.973]);
    const centerRo = fromLonLat([26.1, 44.43]);

    // Sursă POI din API (GeoJSON) cu BBOX
    const poiSource = new VectorSource({
      format: new GeoJSON(),
      url: (extent, res, proj) => {
        const ext4326 = transformExtent(extent, proj, 'EPSG:4326');
        const [minx, miny, maxx, maxy] = ext4326;
        return `${this.settings.apiBase}/poi?minlon=${minx}&minlat=${miny}&maxlon=${maxx}&maxlat=${maxy}&limit=5000`;

      },
      strategy: bboxStrategy
    });

    // Stil simplu pentru puncte
    const poiSimpleStyle = new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: '#19b6d2ff' }),
        stroke: new Stroke({ color: '#ff0000ff', width: 2 })
      })
    });

    // Strat POI
    const poiLayer = new VectorLayer({
      source: poiSource,
      style: poiSimpleStyle
    });

    // Marker fix pentru centru
    const marker = new Feature<Point>({ geometry: new Point(centerRo) });
    marker.setStyle(new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#1976d2' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 })
      })
    }));

    const markerLayer = new VectorLayer({
      source: new VectorSource({ features: [marker] })
    });

    // Hartă + view
    this.map = new Map({
      target: this.mapEl.nativeElement,
      view: new View({ center: initialCenter, zoom: initialZoom })
    });

    // Stil Mapbox GL din TileServer-GL (creează automat layerele vector-tile)
    apply(this.map, styleUrl).catch(err => console.error('Eroare la încărcarea stilului:', err));

    // Ordinea straturilor
    markerLayer.setZIndex(9990);
    poiLayer.setZIndex(9980);

    this.map.addLayer(markerLayer);
    this.map.addLayer(poiLayer);

    // Handler reset view
    window.addEventListener('reset-map-view', this.resetHandler);
  }

  resetView() {
    const centerRo = fromLonLat([26.1, 44.43]);
    this.map.getView().animate({ center: centerRo, zoom: 7, duration: 400 });
  }

  ngOnDestroy(): void {
    window.removeEventListener('reset-map-view', this.resetHandler);
    this.map?.setTarget(undefined as any);
  }
}
