import { InjectionToken, inject } from '@angular/core';
import { ModelBackend } from './model-backend.interface';
import { GeminiService } from './gemini.service';

export const MODEL_BACKEND = new InjectionToken<ModelBackend>('MODEL_BACKEND', {
    providedIn: 'root',
    factory: () => inject(GeminiService)
});
