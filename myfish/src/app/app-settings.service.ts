import { Injectable } from '@angular/core';

export type AppSettings = {
  mapStyleUrl: string;
  apiBase: string;
  mapStyles: string;
};

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private settings!: AppSettings;

  async load(path = '/assets/app-settings.json'): Promise<void> {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
    this.settings = await r.json();
  }

  get mapStyleUrl(): string { return this.settings.mapStyleUrl; }
  get apiBase(): string { return this.settings.apiBase; }
  get mapStyles(): string { return this.settings.mapStyles; }
}
