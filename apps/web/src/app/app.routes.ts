import { Route, UrlMatcher, UrlSegment } from '@angular/router';
import { adminGuard } from '@guards/admin.guard';
import { clientGuard } from '@guards/client.guard';
import { customDomainGuard } from '@guards/custom-domain.guard';

export const atSlugMatcher: UrlMatcher = (segments: UrlSegment[]) => {
  if (segments.length === 1 && segments[0].path.startsWith('@')) {
    return {
      consumed: segments,
      posParams: {
        slug: new UrlSegment(segments[0].path.slice(1), {}),
      },
    };
  }
  return null;
};

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'Profilease — Professional Portfolios & Practice Booking',
    loadComponent: () =>
      import('@features/root/root-entry.component').then(
        (m) => m.RootEntryComponent
      ),
  },
  // --- Admin Portal (Onboarding & Client Directory Only) ---
  {
    path: 'admin/login',
    canActivate: [customDomainGuard],
    title: 'Sign In — Profilease Admin',
    loadComponent: () =>
      import('@features/admin/login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [customDomainGuard, adminGuard],
    loadComponent: () =>
      import('@features/admin/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        title: 'Clients Directory — Profilease Admin',
        loadComponent: () =>
          import('@features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'onboard',
        title: 'Onboard New Client — Profilease Admin',
        loadComponent: () =>
          import('@features/admin/onboard/admin-onboard.component').then(
            (m) => m.AdminOnboardComponent
          ),
      },
      {
        path: 'domains',
        title: 'Domain Routing & DNS — Profilease Admin',
        loadComponent: () =>
          import('@features/admin/domains/admin-domains.component').then(
            (m) => m.AdminDomainsComponent
          ),
      },
      {
        path: 'appointments',
        redirectTo: '',
      },
    ],
  },
  // --- Client Self-Service Portal (Appointments, Services, Timings, Availability) ---
  {
    path: 'portal/login',
    canActivate: [customDomainGuard],
    title: 'Practitioner Portal Sign In — Profilease',
    loadComponent: () =>
      import('@features/portal/portal-login.component').then(
        (m) => m.PortalLoginComponent
      ),
  },
  {
    path: 'portal',
    canActivate: [customDomainGuard, clientGuard],
    loadComponent: () =>
      import('@features/portal/portal-layout.component').then(
        (m) => m.PortalLayoutComponent
      ),
    children: [
      {
        path: '',
        title: 'Appointments Dashboard — Client Portal',
        loadComponent: () =>
          import('@features/portal/portal-appointments.component').then(
            (m) => m.PortalAppointmentsComponent
          ),
      },
      {
        path: 'appointments',
        title: 'Manage Appointments — Client Portal',
        loadComponent: () =>
          import('@features/portal/portal-appointments.component').then(
            (m) => m.PortalAppointmentsComponent
          ),
      },
      {
        path: 'services',
        title: 'Service Catalog & Pricing — Client Portal',
        loadComponent: () =>
          import('@features/portal/portal-services.component').then(
            (m) => m.PortalServicesComponent
          ),
      },
      {
        path: 'availability',
        title: 'Schedule & Availability — Client Portal',
        loadComponent: () =>
          import('@features/portal/portal-availability.component').then(
            (m) => m.PortalAvailabilityComponent
          ),
      },
      {
        path: 'profile',
        title: 'My Profile & Branding — Client Portal',
        loadComponent: () =>
          import('@features/portal/portal-profile.component').then(
            (m) => m.PortalProfileComponent
          ),
      },
    ],
  },
  // --- Public Portfolio Routes ---
  {
    matcher: atSlugMatcher,
    canActivate: [customDomainGuard],
    loadComponent: () =>
      import('@features/portfolio/portfolio-page.component').then(
        (m) => m.PortfolioPageComponent
      ),
  },
  {
    path: 'p/:slug',
    canActivate: [customDomainGuard],
    loadComponent: () =>
      import('@features/portfolio/portfolio-page.component').then(
        (m) => m.PortfolioPageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
