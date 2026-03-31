import { Routes } from '@angular/router';
import { isDevMode } from '@angular/core';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: 'debug', loadComponent: () => import('./debug/debug.component').then(m => m.DebugComponent), canMatch: [() => isDevMode()] },
    { path: '', component: HomeComponent }
];
