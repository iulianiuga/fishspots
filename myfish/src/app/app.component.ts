import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from './core/theme.service';
import { ThemeSwitcherComponent } from './shared/theme-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToolbarModule, // <-- PrimeNG Toolbar
    ButtonModule,  // <-- PrimeNG Button
    ThemeSwitcherComponent
  ],
  template: `
    <p-toolbar>
      <div class="p-toolbar-group-start">
        <span class="font-semibold">MyFish</span>
      </div>
      <div class="p-toolbar-group-end">
        <theme-switcher class="mr-2"></theme-switcher>
        <button pButton icon="pi pi-refresh" label="Reset view" (click)="resetView()"></button>
      </div>
    </p-toolbar>
    <router-outlet />
  `
})
export class AppComponent {
  constructor(private theme: ThemeService) { this.theme.initTheme(); }
  resetView() { window.dispatchEvent(new CustomEvent('reset-map-view')); }
}
