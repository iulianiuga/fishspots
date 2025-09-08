import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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

import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { FeatureLike } from 'ol/Feature';


import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { fromLonLat, transformExtent, toLonLat } from 'ol/proj'; // <-- toLonLat (nou)

import { apply } from 'ol-mapbox-style';
import GeoJSON from 'ol/format/GeoJSON';

import Draw from 'ol/interaction/Draw';       // <-- nou
import Select from 'ol/interaction/Select';   // <-- nou
import { click as clickCondition } from 'ol/events/condition'; // <-- nou

import { AppSettingsService } from '../../app-settings.service';
import { ThemeSwitcherComponent } from '../../shared/theme-switcher.component';

import { HttpClient } from '@angular/common/http';

type Mode = 'none' | 'addLocation' | 'deleteLocation' | 'getInfo';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  imports: [
    CommonModule,
    OverlayPanelModule,
    ButtonModule,
    DropdownModule,
    FormsModule,
    ThemeSwitcherComponent
  ]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  // === UI state ===
  badgeOpen = false;
  mode: Mode = 'none';                             // <-- nou: modul curent

  mapStyles: any[] = [];
  selectedStyle: any;

  private map!: Map;
  private resetHandler = () => this.resetView();

  // === Surse/straturi DB expuse ca membri (nu const locale) ===
  private poiSource!: VectorSource<Feature>;
  private poiLayer!: VectorLayer<VectorSource<Feature>>;

  // === Interacțiuni ===
  private drawInteraction?: Draw;                  // <-- nou
  private selectInteraction?: Select;              // <-- nou

  constructor(private settings: AppSettingsService, private http: HttpClient) { }

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  toggleBadge() {
    this.badgeOpen = !this.badgeOpen;
  }

  ngAfterViewInit(): void {
    // Config inițial
    const styleUrl = this.settings.mapStyleUrl;
    const initialZoom = 6.72;
    const initialCenter = fromLonLat([25.809, 44.973]);
    const centerRo = fromLonLat([26.1, 44.43]);

    // citesc stilurile de hartă available
    this.http.get<any[]>(this.settings.mapStyles).subscribe(styles => {
      this.mapStyles = styles;
      if (styles.length) {
        this.selectedStyle = styles[0];
      }
      // styles.forEach(style => {
      //   console.log(`${style.name} - ${style.id}`);
      // });
    });

    // === Sursă POI din API (GeoJSON) cu BBOX (moved to member) ===
    this.poiSource = new VectorSource({
      format: new GeoJSON(),
      url: (extent, res, proj) => {
        const ext4326 = transformExtent(extent, proj, 'EPSG:4326');
        const [minx, miny, maxx, maxy] = ext4326;
        return `${this.settings.apiBase}/poi?minlon=${minx}&minlat=${miny}&maxlon=${maxx}&maxlat=${maxy}&limit=5000`;
      },
      strategy: bboxStrategy
    });

    // Stil simplu pentru puncte
    // const poiSimpleStyle = new Style({
    //   image: new CircleStyle({
    //     radius: 10,
    //     fill: new Fill({ color: '#19b6d2ff' }),
    //     stroke: new Stroke({ color: '#ff0000ff', width: 2 })
    //   })
    // });


    const poiStyle = (feature: FeatureLike, resolution: number) => {
      const label = feature.get('name') ?? ''; // sau 'label', dupa cum ai in date
      // optional: afiseaza eticheta doar cand esti suficient de aproape
      const showText = resolution < 1050 ? label : '';

      return new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#19b6d2ff' }),
          stroke: new Stroke({ color: '#ff0000ff', width: 2 })
        }),
        text: new Text({
          text: showText,
          font: '12px "Inter", Arial, sans-serif',
          offsetY: -14,                 // mută textul deasupra punctului
          padding: [2, 4, 2, 4],
          fill: new Fill({ color: '#1c1d01ff' }),
          stroke: new Stroke({ color: '#ddcdcdff', width: 3 }), // contur pentru lizibilitate
          overflow: true
        })
      });
    };


    this.poiLayer = new VectorLayer({
      source: this.poiSource,
      style: poiStyle,
      declutter: true
    });

    // Marker fix pentru centru
    // const marker = new Feature<Point>({ geometry: new Point(centerRo) });
    // marker.setStyle(new Style({
    //   image: new CircleStyle({
    //     radius: 6,
    //     fill: new Fill({ color: '#1976d2' }),
    //     stroke: new Stroke({ color: '#ffffff', width: 2 })
    //   })
    // }));

    // const markerLayer = new VectorLayer({
    //   source: new VectorSource({ features: [marker] })
    // });

    // Hartă + view
    this.map = new Map({
      target: this.mapEl.nativeElement,
      view: new View({ center: initialCenter, zoom: initialZoom }),
      controls: defaultControls({ zoom: false })
    });

    // Stil Mapbox GL din TileServer-GL
    apply(this.map, styleUrl).catch(err => console.error('Eroare la încărcarea stilului:', err));

    // Ordinea straturilor
    // markerLayer.setZIndex(9990);
    this.poiLayer.setZIndex(9980);

    //this.map.addLayer(markerLayer);
    this.map.addLayer(this.poiLayer);

    // Zoom pe România la inițializare
    const extent4326 = [20.2201924985, 43.6884447292, 29.62654341, 48.2208812526];
    const extent3857 = transformExtent(extent4326, 'EPSG:4326', this.map.getView().getProjection());
    this.map.getView().fit(extent3857, { duration: 0, padding: [40, 40, 40, 40] });

    // === Interacțiuni OL pregătite (inactive la start) ===
    this.setupInteractions();                      // <-- nou

    // Reset view listener (cum aveai)
    window.addEventListener('reset-map-view', this.resetHandler);
  }

  // === definește interacțiunile pentru moduri ===
  private setupInteractions() {
    // Add point
    this.drawInteraction = new Draw({ source: this.poiSource, type: 'Point' });
    this.drawInteraction.on('drawend', (evt) => {
      const geom = evt.feature.getGeometry() as Point;
      const [lon, lat] = toLonLat(geom.getCoordinates());
      this.http.post(`${this.settings.apiBase}/poi_insert`, { lon, lat }).subscribe({
        next: () => this.poiSource.refresh(), // reîncarcă cu ID/props din DB
        error: (e) => console.error('POST /poi_insert a eșuat:', e)
      });
    });


    // Select (folosit pentru Delete și Info)
    this.selectInteraction = new Select({
      layers: [this.poiLayer],
      condition: clickCondition,
      hitTolerance: 6
    });

    // Ce se întâmplă la click în funcție de modul curent
    this.selectInteraction.on('select', (e) => {
      const f = e.selected[0];
      if (!f) return;

      const fid = (f.getId?.() as any) ?? f.get('id'); // suport și GeoJSON fără feature.id
      const id = Number(fid);
      const props = { ...f.getProperties() };

      if (this.mode === 'deleteLocation') {

        console.log('Șterge feature', { id: fid, props });
        this.http.post(`${this.settings.apiBase}/poi_delete`, { id }).subscribe({
          next: () => this.poiSource.refresh(), // reîncarcă cu ID/props din DB
          error: (e) => console.error('POST /poi_delete:', e)
        });



         } else if (this.mode === 'getInfo') {
           console.log('INFO feature', { id: fid, props });
           // aici poți deschide overlay/side-panel cu props
           // de ex: this.showInfoPanel({ id: fid, ...props });
      }
    });
  }

  onStyleChange(style: any) {
    if (style && style.url) {
      apply(this.map, style.url).catch(err => console.error('Eroare la schimbarea stilului:', err));
    }
  }

  // === modul (apelat din butoanele tale) ===
  setMapBehaviour(behave: Mode) {
    this.mode = behave;

    // scoate orice interacțiune activă
    if (this.drawInteraction) this.map.removeInteraction(this.drawInteraction);
    if (this.selectInteraction) this.map.removeInteraction(this.selectInteraction);

    // pornește ce trebuie
    if (behave === 'addLocation' && this.drawInteraction) {
      this.map.addInteraction(this.drawInteraction);
    } else if ((behave === 'deleteLocation' || behave === 'getInfo') && this.selectInteraction) {
      this.map.addInteraction(this.selectInteraction);
    }

    //this.updateMapCursor(); // feedback cursor
  }

  // // Cursor diferit per mod
  // private updateMapCursor() {
  //   if (!this.map) return;
  //   const vp = this.map.getViewport();
  //   vp.style.cursor =
  //     this.mode === 'addLocation' ? 'crosshair' :
  //       this.mode === 'deleteLocation' ? 'not-allowed' :
  //         this.mode === 'getInfo' ? 'help' : '';
  // }

  resetView() {
    const extent4326 = [20.2201924985, 43.6884447292, 29.62654341, 48.2208812526];
    const extent3857 = transformExtent(extent4326, 'EPSG:4326', this.map.getView().getProjection());
    this.map.getView().fit(extent3857, { duration: 400, padding: [40, 40, 40, 40] });
  }

  ngOnDestroy(): void {
    window.removeEventListener('reset-map-view', this.resetHandler);
    this.map?.setTarget(undefined as any);
  }
}
