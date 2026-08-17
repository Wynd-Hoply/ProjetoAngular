import { Routes } from '@angular/router';



export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  {
    path: 'pre-builds',
    loadComponent: () => import('./features/produtos/lista-produtos/lista-produtos').then((m) => m.ListaProdutosComponent)
  },
  {
    path: 'build-up',
    loadComponent: () => import('./features/build-up/build-up').then((m) => m.BuildUp)
  },
  {
    path: '**',
    redirectTo: '',
  },
];
