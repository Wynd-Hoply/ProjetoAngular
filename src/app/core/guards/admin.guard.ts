import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminService } from '../services/admin';

export const adminGuard: CanActivateFn = (_, state) => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  return adminService.isAuthenticated()
    ? true
    : router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};
