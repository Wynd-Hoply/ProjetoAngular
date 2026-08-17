import { Routes } from '@angular/router';



export const routes: Routes = [
  {
    // Rota inicial da aplicacao.
    path: '',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  {
    // Lista de produtos/pre-builds.
    path: 'pre-builds',
    loadComponent: () => import('./features/pre-Builds/pre-Builds').then((m) => m.Prebuilds)
  },
  {
    // Fluxo de montagem personalizada (build-up).
    path: 'build-up',
    loadComponent: () => import('./features/build-up/build-up').then((m) => m.BuildUp)
  },
  {
    // Fallback para qualquer rota invalida.
    path: '**',
    redirectTo: '',
  },
];
