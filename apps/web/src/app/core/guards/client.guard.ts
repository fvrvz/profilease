import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClientAuthService } from '@service/client-auth.service';

export const clientGuard: CanActivateFn = () => {
  const clientAuth = inject(ClientAuthService);
  const router = inject(Router);

  if (clientAuth.isAuthenticated()) {
    return true;
  }

  router.navigate(['/portal/login']);
  return false;
};
