import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se já existe sessão, o acesso é liberado normalmente.
  if (authService.isAuthenticated()) {
    return true;
  }

  // Caso contrário, redireciona para o login e preserva a URL pretendida.
  return router.createUrlTree(['/auth/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};