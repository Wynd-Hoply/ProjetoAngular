import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Sem sessão: manda para o login normal, preservando a URL pretendida.
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  // Logado, mas sem privilégio admin: não existe painel de login separado
  // para "adivinhar" credenciais, então simplesmente volta para o site.
  if (!authService.isAdmin()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};