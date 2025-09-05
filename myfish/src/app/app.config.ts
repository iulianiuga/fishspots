// import { ApplicationConfig } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { provideAnimations } from '@angular/platform-browser/animations';
// import { routes } from './app.routes';

// export const appConfig: ApplicationConfig = {
//   providers: [provideRouter(routes), provideAnimations()]
// };

import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { AppSettingsService } from './app-settings.service';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'

function initSettings(svc: AppSettingsService) {
  return () => svc.load(); // așteaptă încărcarea JSON-ului din assets
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
        importProvidersFrom(HttpClientModule),
    AppSettingsService,
    { provide: APP_INITIALIZER, useFactory: initSettings, deps: [AppSettingsService], multi: true }
  ]
};

