import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';



export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'pre-builds',
    canActivate: [authGuard],
    loadComponent: () => import('./features/produtos/lista-produtos/lista-produtos').then((m) => m.ListaProdutos)
  },
  {
    path: 'build-up',
    canActivate: [authGuard],
    loadComponent: () => import('./features/build-up/build-up').then((m) => m.BuildUp)
  },
  {
    path: '**',
    redirectTo: '',
  },
];
