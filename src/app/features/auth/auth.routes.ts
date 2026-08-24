import { Routes } from '@angular/router';

// Rotas do módulo de autenticação carregadas sob demanda.
export const authRoutes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login',
	},
	{
		path: 'login',
		pathMatch: 'full',
		redirectTo: '/',
	},
	{
		path: 'register',
		loadComponent: () => import('./register/register').then((m) => m.Register),
	},
];
