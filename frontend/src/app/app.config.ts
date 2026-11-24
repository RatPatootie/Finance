import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { CategoryRepository } from './core/db/category.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    provideAppInitializer(async () => {
      const categories = inject(CategoryRepository);
      // Ask the browser not to evict our IndexedDB (iOS can clear unused site data).
      navigator.storage?.persist?.().catch(() => undefined);
      try {
        await categories.seedDefaultsIfEmpty();
      } catch (err) {
        // Don't block startup; the entry screen will just show no categories.
        console.error('Could not seed default categories', err);
      }
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
