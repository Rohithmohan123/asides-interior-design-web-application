// App configuration for the static demo build (GitHub Pages). Replaces app.config.ts via angular.json
// fileReplacements: hash-based routing (no server rewrites needed) and the in-browser demo API.
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from '../app.routes';
import { authInterceptor } from '../core/auth';
import { DEMO_LOGIN_HINT } from '../core/demo-mode';
import { DEMO_PASSWORD, DEMO_USER, demoApiInterceptor } from './demo-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withHashLocation(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, demoApiInterceptor])),
    { provide: DEMO_LOGIN_HINT, useValue: `Live demo: sign in with ${DEMO_USER} / ${DEMO_PASSWORD}. Changes are kept in this tab only and reset when you reload.` }
  ]
};
