import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';

import { apply } from 'ol-mapbox-style';

@Component({
  selector: 'app-map',
  standalone: true,
  template: `<div #mapEl id="map" style="width:100%"></div>`
})



export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  private map!: Map;
  private resetHandler = () => this.resetView();

  ngAfterViewInit(): void {
    const centerRo = fromLonLat([26.1, 44.43]);

    const marker = new Feature<Point>({ geometry: new Point(centerRo) });
    marker.setStyle(new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#1976d2' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 })
      })
    }));




    // Linkul tău de vizualizare e cu ?vector#..., dar pentru OL ai nevoie de style.json
    const styleUrl = 'http://192.168.3.106:8125/styles/sbu01/style.json';

    const initialZoom = 6.72;
    const initialCenter = fromLonLat([25.809, 44.973]);

    // this.map = new Map({
    //   target: this.mapEl.nativeElement,
    //   layers: [ new TileLayer({ source: new OSM() }), vector ],
    //   view: new View({ center: centerRo, zoom: 7 })
    // });

    this.map = new Map({
      target: this.mapEl.nativeElement,
      view: new View({ center: initialCenter, zoom: initialZoom })
    });

    // Încarcă stilul Mapbox GL din TileServer-GL (creează layerele vector tile automat)
    apply(this.map, styleUrl)
      .catch(err => console.error('Eroare la încărcarea stilului:', err));

    const markerLayer = new VectorLayer({
      source: new VectorSource({ features: [marker] })
    });
    markerLayer.setZIndex(9999); // sigur deasupra

    this.map.addLayer(markerLayer);

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
