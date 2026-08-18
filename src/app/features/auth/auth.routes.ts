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
		loadComponent: () => import('./login/login').then((m) => m.Login),
	},
	{
		path: 'register',
		loadComponent: () => import('./register/register').then((m) => m.Register),
	},
];
