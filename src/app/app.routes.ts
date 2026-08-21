import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { BuildUp } from './features/build-up/build-up';

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
    path: 'home',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  // ORDEM CRÍTICA: Rota específica sempre antes da genérica
  {
    path: 'components/item/:id',
    loadComponent: () => import('./features/produtos/produto/produtos').then((m) => m.Produto),
  },
  {
    path: 'components',
    loadComponent: () => import('./features/produtos/lista-produtos/lista-produtos').then((m) => m.ListaProdutos),
  },
  {
    path: 'components/:category',
    loadComponent: () => import('./features/produtos/lista-produtos/lista-produtos').then((m) => m.ListaProdutos),
  },
  {
    path: 'compare',
    loadComponent: () => import('./features/compare/compare').then((m) => m.Compare),
  },
  {
    path: 'builds',
    loadComponent: () => import('./features/builds/builds').then((m) => m.Builds),
  },
  {
    path: 'builds/:id',
    loadComponent: () => import('./features/build-summary/build-summary').then((m) => m.BuildSummary),
  },
  {
    path: 'pre-builds',
    redirectTo: 'builds',
  },
  {
    path: 'builder',
    component: BuildUp,
  },
  {
    path: 'build-up',
    redirectTo: 'builder',
  },
  {
    path: '**',
    redirectTo: '',
  },
];