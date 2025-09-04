import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from './core/theme.service';
import { ThemeSwitcherComponent } from './shared/theme-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToolbarModule, ButtonModule, ThemeSwitcherComponent],
  template: `
    <p-toolbar>
      <div class="p-toolbar-group-start">
        <!-- <span class="pi pi-map" style="margin-right:.5rem"></span> -->
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
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  constructor(private theme: ThemeService) { this.theme.initTheme(); }
  resetView() { window.dispatchEvent(new CustomEvent('reset-map-view')); }
}
