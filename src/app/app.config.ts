import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { MODEL_BACKEND } from './services/model-token';
import { GeminiService } from './services/gemini.service';
import { OllamaService } from './services/ollama.service';
import { LmStudioService } from './services/lmstudio.service';
import { TransformersService } from './services/transformers.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    // { provide: MODEL_BACKEND, useClass: GeminiService }, // Default, no need to specify if providedIn: 'root' works, but good to have explicit
    // { provide: MODEL_BACKEND, useClass: OllamaService }, // Uncomment to use Ollama
    // { provide: MODEL_BACKEND, useClass: LmStudioService }, // Uncomment to use LM Studio
    // { provide: MODEL_BACKEND, useClass: TransformersService } // Uncomment to use transformers.js
  ]
};
