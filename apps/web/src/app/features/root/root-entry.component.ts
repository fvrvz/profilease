import { Component, inject } from '@angular/core';
import { TenantContextService } from '@service/tenant-context.service';
import { LandingPageComponent } from '@features/landing/landing-page.component';
import { PortfolioPageComponent } from '@features/portfolio/portfolio-page.component';

@Component({
  selector: 'app-root-entry',
  imports: [LandingPageComponent, PortfolioPageComponent],
  template: `
    @if (tenantContext.isCustomDomain()) {
      <app-portfolio-page [customDomainHost]="tenantContext.hostname()" />
    } @else {
      <app-landing-page />
    }
  `,
})
export class RootEntryComponent {
  protected readonly tenantContext = inject(TenantContextService);
}
