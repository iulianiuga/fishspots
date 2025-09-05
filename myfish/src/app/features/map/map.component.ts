import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- adaugă acest import
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

import Map from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control';

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
import { ThemeSwitcherComponent } from '../../shared/theme-switcher.component';

import { HttpClient } from '@angular/common/http';



@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  imports: [
    CommonModule,
    OverlayPanelModule, // <-- PrimeNG OverlayPanel
    ButtonModule,        // <-- PrimeNG Button
    DropdownModule,
    FormsModule,
    ThemeSwitcherComponent // <-- adaugă aici
  ]
})


export class MapComponent implements AfterViewInit, OnDestroy {
  badgeOpen = false;
  mapStyles: any[] = [];
  selectedStyle: any;
  private map!: Map;
  private resetHandler = () => this.resetView();

  constructor(private settings: AppSettingsService, private http: HttpClient) { }

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  toggleBadge() {
    this.badgeOpen = !this.badgeOpen;
  }

  ngAfterViewInit(): void {
    // Config inițial
    const styleUrl = this.settings.mapStyleUrl;// 'http://192.168.3.106:8125/styles/sbu01/style.json';
    const initialZoom = 6.72;
    const initialCenter = fromLonLat([25.809, 44.973]);
    const centerRo = fromLonLat([26.1, 44.43]);


    //citesc stilurile de harta available 
    this.http.get<any[]>(this.settings.mapStyles).subscribe(styles => {
      this.mapStyles = styles;
      if (styles.length) {
        this.selectedStyle = styles[0];
      }
      styles.forEach(style => {
        console.log(`${style.name} - ${style.id}`);
      });
    });


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
      view: new View({ center: initialCenter, zoom: initialZoom }),
      controls: defaultControls({ zoom: false }) // <-- elimină butoanele de zoom
    });

    // Stil Mapbox GL din TileServer-GL (creează automat layerele vector-tile)
    apply(this.map, styleUrl).catch(err => console.error('Eroare la încărcarea stilului:', err));

    // Ordinea straturilor
    markerLayer.setZIndex(9990);
    poiLayer.setZIndex(9980);

    this.map.addLayer(markerLayer);
    this.map.addLayer(poiLayer);

    // Zoom pe România la inițializare
    const extent4326 = [20.2201924985, 43.6884447292, 29.62654341, 48.2208812526];
    const extent3857 = transformExtent(extent4326, 'EPSG:4326', this.map.getView().getProjection());
    this.map.getView().fit(extent3857, { duration: 0, padding: [40, 40, 40, 40] });

    window.addEventListener('reset-map-view', this.resetHandler);
  }

  onStyleChange(style: any) {
    if (style && style.url) {
      apply(this.map, style.url).catch(err => console.error('Eroare la schimbarea stilului:', err));
    }
  }

  resetView() {
    // Extinderea pentru România în EPSG:4326
    const extent4326 = [20.2201924985, 43.6884447292, 29.62654341, 48.2208812526];
    // Transformă extinderea în proiecția hărții (EPSG:3857)
    const extent3857 = transformExtent(extent4326, 'EPSG:4326', this.map.getView().getProjection());
    // Zoom to extindere
    this.map.getView().fit(extent3857, { duration: 400, padding: [40, 40, 40, 40] });
  }

  ngOnDestroy(): void {
    window.removeEventListener('reset-map-view', this.resetHandler);
    this.map?.setTarget(undefined as any);
  }
}
