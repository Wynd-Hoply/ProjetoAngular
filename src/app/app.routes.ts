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
  // Perfil público (não exige login para visualizar).
  {
    path: 'perfil/:username',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
    data: { tab: 'geral' },
  },
  {
    path: 'perfil/:username/builds',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
    data: { tab: 'builds' },
  },
  {
    path: 'builds',
    canActivate: [authGuard],
    loadComponent: () => import('./features/builds/builds').then((m) => m.Builds),
  },
  {
    path: 'builds/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/build-summary/build-summary').then((m) => m.BuildSummary),
  },
  {
    path: 'auto-build',
    loadComponent: () => import('./features/auto-build/auto-build').then((m) => m.AutoBuild),
  },
  {
    path: 'pre-builds',
    redirectTo: 'builds',
  },
  {
    path: 'builder',
    canActivate: [authGuard],
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