import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantContextService } from '@service/tenant-context.service';

/**
 * Blocks SaaS platform routes (/admin, /portal, /@slug) when accessed from a practitioner's custom domain.
 */
export const customDomainGuard: CanActivateFn = () => {
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  if (tenantContext.isCustomDomain()) {
    return router.createUrlTree(['/']);
  }
  return true;
};
