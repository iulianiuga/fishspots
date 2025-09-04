import { Routes } from '@angular/router';
import { MapComponent } from './features/map/map.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'map' },
  { path: 'map', component: MapComponent },
  { path: '**', redirectTo: 'map' }
];
