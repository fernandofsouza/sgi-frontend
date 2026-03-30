import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG,
  MsalService, MsalGuard, MsalBroadcastService, MsalInterceptor,
} from '@azure/msal-angular';
import {
  PublicClientApplication, InteractionType, BrowserCacheLocation,
} from '@azure/msal-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// ── MSAL Instance Factory ────────────────────────────────────────────────────
function msalInstanceFactory() {
  return new PublicClientApplication({
    auth: {
      clientId:    environment.entraId.clientId,
      authority:   `https://login.microsoftonline.com/${environment.entraId.tenantId}`,
      redirectUri: environment.entraId.redirectUri,
    },
    cache: {
      cacheLocation:       BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false,
    },
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor])
    ),

    // ── MSAL providers ───────────────────────────────────────────────────────
    { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },

    {
      provide: MSAL_GUARD_CONFIG,
      useValue: {
        interactionType: InteractionType.Redirect,
        authRequest: { scopes: environment.entraId.scopes },
      },
    },

    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          [environment.apiUrl, environment.entraId.scopes],
        ]),
      },
    },

    // Interceptor MSAL (injeta token Bearer automaticamente)
    ...(environment.entraId.enabled
      ? [{ provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true }]
      : []),

    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};
